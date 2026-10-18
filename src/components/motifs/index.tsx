import type {FC} from 'react';
import type {Motif} from '../../data/milestones';
import {ArpanetTerminals} from './ArpanetTerminals';
import {EthernetBus} from './EthernetBus';
import {TcpHandshake} from './TcpHandshake';
import {DnsTree} from './DnsTree';
import {HyperWeb} from './HyperWeb';
import {BrowserWindow} from './BrowserWindow';
import {WifiWaves} from './WifiWaves';
import {MobileTower} from './MobileTower';
import {Ipv6Sea} from './Ipv6Sea';
import {Cell5G} from './Cell5G';

const REGISTRY: Record<Motif, FC<{progress: number; frame: number}>> = {
  terminals: ArpanetTerminals,
  bus: EthernetBus,
  handshake: TcpHandshake,
  dns: DnsTree,
  web: HyperWeb,
  browser: BrowserWindow,
  wifi: WifiWaves,
  mobile: MobileTower,
  ipv6: Ipv6Sea,
  cell5g: Cell5G,
};

export const MotifRenderer: FC<{
  motif: Motif;
  progress: number;
  frame: number;
}> = ({motif, progress, frame}) => {
  const C = REGISTRY[motif];
  return <C progress={progress} frame={frame} />;
};
