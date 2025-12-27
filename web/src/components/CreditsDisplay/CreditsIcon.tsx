/**
 * CreditsIcon - 积分图标组件
 *
 * 纯展示组件，无状态和逻辑
 * 显示积分符号：⭐
 *
 * @returns {React.ReactElement} 积分图标
 *
 * @example
 * <CreditsIcon />
 */
export function CreditsIcon(): React.ReactElement {
  return (
    <span
      className="credits-icon"
      data-testid="credits-icon"
      role="img"
      aria-label="credits"
      title="User Credits"
    >
      ⭐
    </span>
  );
}
