/** 全局 SVG 滤镜定义：供 Camera 故障特效等使用 */
export const GlobalDefs: React.FC = () => {
  return (
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <defs>
        {/* RGB 分离用：只保留红色通道 */}
        <filter id="rgbRed">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
          />
        </filter>
        {/* 只保留青蓝通道 */}
        <filter id="rgbCyan">
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  );
};
