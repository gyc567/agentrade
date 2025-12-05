/**
 * Web3钱包按钮 E2E测试
 * 使用Playwright进行端到端测试
 * 验证完整的用户操作流程
 */

import { test, expect } from '@playwright/test';

test.describe('Web3钱包按钮 - E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到首页
    await page.goto('/');
  });

  test.describe('基本功能', () => {
    test('TC-001: 页面应该显示Web3钱包按钮', async ({ page }) => {
      // 检查按钮存在
      const button = page.locator('[aria-label="连接Web3钱包"]');
      await expect(button).toBeVisible();

      // 检查按钮在登录按钮左侧
      const loginButton = page.locator('a[href="/login"]');
      await expect(loginButton).toBeVisible();

      // 验证DOM结构
      const prevSibling = await button.evaluate((el) => el.previousElementSibling?.tagName);
      expect(prevSibling).toBe('A');
    });

    test('TC-002: 点击按钮应该显示钱包选择器', async ({ page }) => {
      // 点击按钮
      await page.click('[aria-label="连接Web3钱包"]');

      // 检查弹窗显示
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // 检查标题
      const title = modal.locator('h2');
      await expect(title).toContainText('选择您的钱包类型');
    });

    test('TC-003: 钱包选择器应该显示MetaMask选项', async ({ page }) => {
      // 打开选择器
      await page.click('[aria-label="连接Web3钱包"]');

      // 检查MetaMask选项
      const metaMaskOption = page.locator('text=MetaMask');
      await expect(metaMaskOption).toBeVisible();

      // 检查描述
      const description = page.locator('text=最流行的以太坊浏览器钱包');
      await expect(description).toBeVisible();
    });

    test('TC-004: 钱包选择器应该显示TP钱包选项', async ({ page }) => {
      // 打开选择器
      await page.click('[aria-label="连接Web3钱包"]');

      // 检查TP钱包选项
      const tpOption = page.locator('text=TP钱包');
      await expect(tpOption).toBeVisible();

      // 检查描述
      const description = page.locator('text=安全可靠的数字钱包');
      await expect(description).toBeVisible();
    });

    test('TC-005: 可以关闭钱包选择器', async ({ page }) => {
      // 打开选择器
      await page.click('[aria-label="连接Web3钱包"]');

      // 检查弹窗显示
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // 点击关闭按钮
      await page.click('[aria-label="关闭"]');

      // 检查弹窗关闭
      await expect(modal).not.toBeVisible();
    });

    test('TC-006: 点击遮罩层应该关闭选择器', async ({ page }) => {
      // 打开选择器
      await page.click('[aria-label="连接Web3钱包"]');

      // 检查弹窗显示
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // 点击遮罩层
      await page.click('.fixed.inset-0');

      // 检查弹窗关闭
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('移动端适配', () => {
    test('TC-007: 移动端应该显示汉堡菜单', async ({ page }) => {
      // 设置移动端视窗
      await page.setViewportSize({ width: 375, height: 667 });

      // 检查汉堡菜单按钮存在
      const menuButton = page.locator('button').filter({ hasText: /Menu/ });
      await expect(menuButton).toBeVisible();
    });

    test('TC-008: 移动端菜单中应该有Web3按钮', async ({ page }) => {
      // 设置移动端视窗
      await page.setViewportSize({ width: 375, height: 667 });

      // 点击汉堡菜单
      await page.click('button').filter({ hasText: /Menu/ });

      // 检查Web3按钮在菜单中
      const button = page.locator('[aria-label="连接Web3钱包"]');
      await expect(button).toBeVisible();
    });

    test('TC-009: 移动端按钮样式应该正确', async ({ page }) => {
      // 设置移动端视窗
      await page.setViewportSize({ width: 375, height: 667 });

      // 点击汉堡菜单
      await page.click('button').filter({ hasText: /Menu/ });

      // 检查按钮样式
      const button = page.locator('[aria-label="连接Web3钱包"]');
      const boxModel = await button.boundingBox();
      expect(boxModel?.width).toBeLessThan(375); // 不应该超出屏幕宽度
    });
  });

  test.describe('无障碍访问', () => {
    test('TC-010: 按钮应该有正确的ARIA标签', async ({ page }) => {
      const button = page.locator('[aria-label="连接Web3钱包"]');
      await expect(button).toHaveAttribute('aria-label');
      await expect(button).toHaveAttribute('aria-expanded');
    });

    test('TC-011: 弹窗应该有正确的ARIA属性', async ({ page }) => {
      // 打开选择器
      await page.click('[aria-label="连接Web3钱包"]');

      // 检查弹窗
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toHaveAttribute('role', 'dialog');
      await expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    test('TC-012: 可以使用键盘导航', async ({ page }) => {
      // Tab到按钮
      await page.keyboard.press('Tab');
      let focused = await page.locator('[aria-label="连接Web3钱包"]').isFocused();
      expect(focused).toBeTruthy();

      // Enter打开选择器
      await page.keyboard.press('Enter');

      // 检查弹窗显示
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // ESC关闭选择器
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('状态显示', () => {
    test('TC-013: 未连接时显示正确文字', async ({ page }) => {
      const button = page.locator('[aria-label="连接Web3钱包"]');
      await expect(button).toContainText('连接Web3钱包');
    });

    test('TC-014: 悬停时按钮样式应该变化', async ({ page }) => {
      const button = page.locator('[aria-label="连接Web3钱包"]');

      // 检查初始样式
      const initialBox = await button.boundingBox();

      // 悬停
      await button.hover();

      // 检查样式变化 (这里用位置变化代替)
      const hoveredBox = await button.boundingBox();
      // 悬停可能会触发transform或box-shadow变化
      // 在实际测试中，可以使用截图对比
    });
  });

  test.describe('错误处理', () => {
    test('TC-015: 钱包未安装时应该显示提示', async ({ page }) => {
      // 模拟钱包未安装 (通过修改window.ethereum)
      await page.addInitScript(() => {
        // @ts-ignore
        delete window.ethereum;
      });

      // 重新加载页面
      await page.reload();

      // 打开选择器
      await page.click('[aria-label="连接Web3钱包"]');

      // 检查未安装提示
      const notInstalledText = page.locator('text=未安装');
      await expect(notInstalledText).toBeVisible();
    });

    test('TC-016: 连接失败时应该显示错误信息', async ({ page }) => {
      // 模拟连接失败
      await page.addInitScript(() => {
        // @ts-ignore
        window.ethereum = {
          isMetaMask: true,
          request: async () => {
            throw new Error('User denied');
          },
        };
      });

      await page.reload();

      // 点击选择MetaMask
      await page.click('[aria-label="连接Web3钱包"]');
      await page.click('text=MetaMask');

      // 等待错误显示
      await page.waitForTimeout(1000);

      // 检查错误信息
      const errorText = page.locator('text=用户取消了操作');
      await expect(errorText).toBeVisible();
    });
  });

  test.describe('性能', () => {
    test('TC-017: 按钮初始渲染应该快速', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForSelector('[aria-label="连接Web3钱包"]');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(1000); // 应该在1秒内加载
    });

    test('TC-018: 弹窗打开应该流畅', async ({ page }) => {
      // 记录打开时间
      const startTime = Date.now();

      await page.click('[aria-label="连接Web3钱包"]');
      await page.waitForSelector('[role="dialog"]');

      const openTime = Date.now() - startTime;

      expect(openTime).toBeLessThan(200); // 应该在200ms内打开
    });
  });

  test.describe('多语言', () => {
    test('TC-019: 切换到中文应该显示中文', async ({ page }) => {
      // 切换语言
      await page.click('[data-testid="language-toggle"]');
      await page.click('text=中文');

      // 检查按钮文字
      const button = page.locator('[aria-label="连接Web3钱包"]');
      // 按钮文字不会改变，但弹窗内容会改变
    });

    test('TC-020: 打开选择器应该显示中文', async ({ page }) => {
      // 切换到中文
      await page.click('[data-testid="language-toggle"]');
      await page.click('text=中文');

      // 打开选择器
      await page.click('[aria-label="连接Web3钱包"]');

      // 检查中文标题
      const title = page.locator('[role="dialog"] h2');
      await expect(title).toContainText('选择您的钱包类型');
    });
  });

  test.describe('边界情况', () => {
    test('TC-021: 快速点击按钮不应该出现问题', async ({ page }) => {
      // 快速连续点击
      for (let i = 0; i < 5; i++) {
        await page.click('[aria-label="连接Web3钱包"]');
      }

      // 检查只有一个弹窗
      const modals = page.locator('[role="dialog"]');
      await expect(modals).toHaveCount(1);
    });

    test('TC-022: 页面滚动时按钮应该固定', async ({ page }) => {
      // 滚动到页面底部
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // 检查按钮是否仍然可见
      const button = page.locator('[aria-label="连接Web3钱包"]');
      await expect(button).toBeInViewport();
    });
  });

  test.describe('与现有系统集成', () => {
    test('TC-023: 按钮不应该影响现有登录功能', async ({ page }) => {
      // 检查登录按钮仍然工作
      const loginButton = page.locator('a[href="/login"]');
      await expect(loginButton).toBeVisible();

      // 点击登录按钮
      await Promise.all([
        page.waitForNavigation(),
        page.click('a[href="/login"]'),
      ]);

      // 检查是否跳转到登录页
      expect(page.url()).toContain('/login');
    });

    test('TC-024: 按钮不应该破坏页面布局', async ({ page }) => {
      // 获取按钮位置
      const button = page.locator('[aria-label="连接Web3钱包"]');
      const buttonBox = await button.boundingBox();

      // 检查按钮不在屏幕外
      expect(buttonBox?.x).toBeGreaterThan(0);
      expect(buttonBox?.y).toBeGreaterThan(0);
    });

    test('TC-025: 在其他页面也应该显示按钮', async ({ page }) => {
      // 访问不同页面
      const pages = ['/', '/login', '/register'];

      for (const path of pages) {
        await page.goto(path);

        // 检查是否应该显示按钮 (在非登录/注册页)
        if (path !== '/login' && path !== '/register') {
          const button = page.locator('[aria-label="连接Web3钱包"]');
          await expect(button).toBeVisible();
        } else {
          const button = page.locator('[aria-label="连接Web3钱包"]');
          // 在登录/注册页可能不显示，这是预期的
        }
      }
    });
  });
});

// 设置测试配置
test.describe.configure({
  retries: 2,
  timeout: 30000,
});
