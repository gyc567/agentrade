import styles from './credits.module.css';

/**
 * CreditsValue 组件属性
 */
export interface CreditsValueProps {
  value: number;
  format?: 'number' | 'short';
  onOpen?: () => void;
}

/**
 * 格式化大数字为简化形式
 * 例如：1000 -> 1k, 1500000 -> 1.5M
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
 * 点击打开支付modal，允许用户购买积分
 */
export function CreditsValue({
  value,
  format = 'number',
  onOpen,
}: CreditsValueProps): React.ReactElement {
  const displayValue = format === 'short' ? formatShortNumber(value) : value;

  const handleClick = () => {
    onOpen?.();
  };

  return (
    <span
      className={styles.creditsValue}
      data-testid="credits-value"
      data-value={value}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {displayValue}(用户积分)
    </span>
  );
}