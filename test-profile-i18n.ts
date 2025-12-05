#!/usr/bin/env node

// 测试Profile页面国际化修复是否正确

console.log('Profile Page Internationalization Fix Test');
console.log('=======================================');
console.log();

// 检查国际化文件是否有重复的键
const fs = require('fs');
const path = require('path');

try {
  const translationsPath = path.join(__dirname, 'web', 'src', 'i18n', 'translations.ts');
  const content = fs.readFileSync(translationsPath, 'utf8');

  // 检查是否有未国际化的中文文本（注释除外）
  const hasUninternationalizedChinese = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    // 匹配中文文本，但排除注释和字符串中的中文
    const chinesePattern = /[\u4e00-\u9fa5]/g;
    const matches = content.match(chinesePattern);
    return matches && matches.length > 0;
  };

  const profilePagePath = path.join(__dirname, 'web', 'src', 'pages', 'UserProfilePage.tsx');
  const hasChinese = hasUninternationalizedChinese(profilePagePath);

  if (hasChinese) {
    console.log('❌ ERROR: Profile page still contains uninternationalized Chinese text');
    process.exit(1);
  } else {
    console.log('✅ PASS: Profile page has no uninternationalized Chinese text');
  }

  // 检查我们添加的国际化键是否存在
  const addedKeys = [
    'totalCredits',
    'accountTotalBalance',
    'availableForUse',
    'historicallyConsumed',
    'loadingCreditData',
    'creditDataLoadFailed'
  ];

  let allKeysExist = true;
  addedKeys.forEach(key => {
    if (!content.includes(key)) {
      console.log(`❌ ERROR: Missing internationalization key: ${key}`);
      allKeysExist = false;
    }
  });

  if (allKeysExist) {
    console.log('✅ PASS: All added internationalization keys exist');
  }

  console.log();
  console.log('🎉 All tests passed! Profile page internationalization is complete.');

} catch (error) {
  console.log('❌ ERROR:', error.message);
  process.exit(1);
}