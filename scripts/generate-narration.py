"""Generate real Edge TTS audio and sentence-timed captions for the 60s film.

Requires Python 3.10+, edge-tts==7.3.1 and the installed Remotion compositor.
Only this build step needs the network; Studio and rendering use local assets.
"""

import argparse
import asyncio
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import wave

import edge_tts
import aiohttp

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "src/data/narration-script.json"
TIMING = ROOT / "src/data/narration-timing.json"
OUTPUT = ROOT / "public/narration"


def ffmpeg_path() -> str:
    binary = shutil.which("ffmpeg")
    if binary:
        return binary
    candidates = list((ROOT / "node_modules/@remotion").glob("compositor-*/ffmpeg*"))
    candidates = [path for path in candidates if path.name in ("ffmpeg", "ffmpeg.exe")]
    if not candidates:
        raise RuntimeError("Install npm dependencies first; Remotion's FFmpeg was not found.")
    return str(candidates[0])


def convert(binary: str, source: Path, target: Path) -> float:
    subprocess.run([
        binary, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", "48000", "-ac", "1",
        "-c:a", "pcm_s16le", str(target),
    ], check=True)
    with wave.open(str(target), "rb") as audio:
        return audio.getnframes() / audio.getframerate()


def stamp(milliseconds: int, separator: str = ",") -> str:
    seconds, fraction = divmod(milliseconds, 1000)
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02}{separator}{fraction:03}"


def write_json(path: Path, data: dict) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


async def synthesize(config: dict, segment: dict, rate: int, target: Path) -> list[dict]:
    text = "".join(sentence["speech"] for sentence in segment["sentences"])
    last_error = None
    for attempt in range(3):
        boundaries = []
        try:
            communicate = edge_tts.Communicate(
                text, config["voice"], rate=f"{rate:+d}%", pitch=config["pitch"],
                boundary="SentenceBoundary", connect_timeout=15, receive_timeout=45,
            )
            with target.open("wb") as media:
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        media.write(chunk["data"])
                    elif chunk["type"] == "SentenceBoundary":
                        boundaries.append(chunk)
            if len(boundaries) != len(segment["sentences"]):
                raise RuntimeError(f"{segment['id']}: expected {len(segment['sentences'])} sentence boundaries, got {len(boundaries)}")
            return boundaries
        except (OSError, RuntimeError, TimeoutError, aiohttp.ClientError, edge_tts.exceptions.EdgeTTSException) as error:
            last_error = error
            if attempt < 2:
                await asyncio.sleep(1 + attempt)
    raise RuntimeError(f"Edge TTS failed for {segment['id']}: {last_error}") from last_error


async def main(force: bool) -> None:
    config = json.loads(SCRIPT.read_text(encoding="utf-8"))
    fps = config["fps"]
    slot = config["segmentFrames"]
    lead = config["leadInFrames"]
    available = (slot - lead - config["tailFrames"]) / fps
    assert fps > 0 and slot > 0 and available > 0
    OUTPUT.mkdir(parents=True, exist_ok=True)
    binary = ffmpeg_path()
    clips = []
    with tempfile.TemporaryDirectory(prefix="edge-tts-", dir=OUTPUT) as work:
        work = Path(work)
        for index, segment in enumerate(config["segments"]):
            identifier = segment["id"]
            assert identifier and all(character.isalnum() or character == "-" for character in identifier)
            signature = hashlib.sha256(json.dumps({
                "segment": segment, "voice": config["voice"], "rate": config["rate"],
                "pitch": config["pitch"], "available": available,
            }, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
            destination = OUTPUT / f"{identifier}.wav"
            cache = OUTPUT / f"{identifier}.json"
            metadata = json.loads(cache.read_text(encoding="utf-8")) if cache.exists() else None
            if not force and destination.exists() and metadata and metadata.get("signature") == signature:
                with wave.open(str(destination), "rb") as audio:
                    cached_duration = audio.getnframes() / audio.getframerate()
                assert abs(cached_duration - metadata["durationSeconds"]) < 0.001
                assert cached_duration <= available
                print(f"Cached {identifier}: {cached_duration:.2f}s", flush=True)
            else:
                rate = int(config["rate"].rstrip("%"))
                for _ in range(4):
                    boundaries = await synthesize(config, segment, rate, work / "speech.mp3")
                    duration = convert(binary, work / "speech.mp3", work / "speech.wav")
                    if duration <= available:
                        break
                    rate = max(rate + 5, math.ceil((100 + rate) * duration / (available - 0.12) - 100))
                    if rate > 45:
                        raise RuntimeError(f"{identifier}: shorten the narration to fit {available:.2f}s naturally")
                else:
                    raise RuntimeError(f"{identifier}: narration does not fit its chapter")
                captions = []
                for sentence, boundary in zip(segment["sentences"], boundaries):
                    start = round(boundary["offset"] / 10000)
                    end = min(round(duration * 1000), round((boundary["offset"] + boundary["duration"]) / 10000) + 100)
                    if not 0 <= start < end <= round(available * 1000):
                        raise RuntimeError(f"{identifier}: invalid speech boundary {start}..{end}")
                    captions.append({"startMs": start, "endMs": end, "text": sentence["caption"]})
                for current, following in zip(captions, captions[1:]):
                    current["endMs"] = min(current["endMs"], following["startMs"])
                metadata = {"signature": signature, "durationSeconds": duration, "rate": f"{rate:+d}%", "captions": captions}
                # Copy out of TemporaryDirectory before publishing: Python's
                # private temporary-directory ACL must not follow a Windows move.
                publish = destination.with_suffix(".wav.tmp")
                shutil.copyfile(work / "speech.wav", publish)
                os.replace(publish, destination)
                write_json(cache, metadata)
                print(f"Generated {identifier}: {duration:.2f}s, Yunxi {rate:+d}%", flush=True)
            from_frame = index * slot + lead
            offset = round(from_frame / fps * 1000)
            clips.append({
                "id": identifier, "src": f"narration/{identifier}.wav", "from": from_frame,
                "durationInFrames": math.ceil(metadata["durationSeconds"] * fps),
                "durationSeconds": metadata["durationSeconds"], "rate": metadata["rate"],
                "captions": [{**caption, "startMs": caption["startMs"] + offset, "endMs": caption["endMs"] + offset} for caption in metadata["captions"]],
            })
    result = {"voice": config["voice"], "fps": fps, "totalFrames": slot * len(clips), "clips": clips}
    # Publish timing only once every clip is present, so partial synthesis never
    # masquerades as a completed soundtrack.
    write_json(TIMING, result)
    captions = [caption for clip in clips for caption in clip["captions"]]
    srt = "\n\n".join(f"{index}\n{stamp(caption['startMs'])} --> {stamp(caption['endMs'])}\n{caption['text']}" for index, caption in enumerate(captions, 1)) + "\n"
    (OUTPUT / "network-chronicle.srt").write_text(srt, encoding="utf-8")
    print(f"Ready: {len(clips)} audio clips, {len(captions)} synchronized subtitles.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="Regenerate cached Edge TTS clips")
    asyncio.run(main(parser.parse_args().force))
