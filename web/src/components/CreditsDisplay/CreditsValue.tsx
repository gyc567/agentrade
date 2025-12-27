/**
 * CreditsValue 组件属性
 */
export interface CreditsValueProps {
  value: number;
  format?: 'number' | 'short';
}

/**
 * 格式化大数字为简化形式
 * 例如：1000 -> 1k, 1500000 -> 1.5M
 *
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的数字
 */
function formatShortNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * CreditsValue - 积分数值组件
 *
 * 纯展示组件，用于显示积分数值
 * 支持两种格式：
 * - 'number': 完整数字 (1000)
 * - 'short': 简化形式 (1k)
 *
 * @param {CreditsValueProps} props - 组件属性
 * @returns {React.ReactElement} 积分数值
 *
 * @example
 * <CreditsValue value={750} />
 * // 显示：750
 *
 * <CreditsValue value={1000} format="short" />
 * // 显示：1k
 */
export function CreditsValue({
  value,
  format = 'number',
}: CreditsValueProps): React.ReactElement {
  const displayValue = format === 'short' ? formatShortNumber(value) : value;

  return (
    <span
      className="credits-value"
      data-testid="credits-value"
      data-value={value}
    >
      {displayValue}
    </span>
  );
}
