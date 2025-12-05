import { useEffect, useState } from 'react';
import { marked } from 'marked';
import HeaderBar from './landing/HeaderBar';
import { useLanguage } from '../contexts/LanguageContext';

// 配置marked
marked.setOptions({
  breaks: true,
  gfm: true
});

export function UserManualPage() {
  const { language } = useLanguage();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 从URL中获取语言参数
  const getLangFromUrl = () => {
    const path = window.location.pathname;
    const parts = path.split('/');

    if (parts.includes('zh')) {
      return 'zh';
    } else if (parts.includes('en')) {
      return 'en';
    }

    return language;
  };

  // 语言映射
  const languageMap: Record<string, string> = {
    'en': 'user-manual-en.md',
    'zh': 'user-manual-zh.md'
  };

  const [currentLang, setCurrentLang] = useState(getLangFromUrl());

  // 获取当前语言的用户手册文件
  const manualFile = languageMap[currentLang];

  useEffect(() => {
    // 加载MD文件并转换为HTML
    const loadManual = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/docs/${manualFile}`);
        const mdContent = await response.text();
        const html = await marked(mdContent); // 处理Promise
        setHtmlContent(html);
      } catch (error) {
        console.error('加载用户手册失败:', error);
        setHtmlContent('<p>加载用户手册失败</p>');
      } finally {
        setLoading(false);
      }
    };

    loadManual();
  }, [manualFile]);

  // 切换语言
  const handleLanguageChange = (newLang: 'en' | 'zh') => {
    setCurrentLang(newLang);
    // 更新URL并重新加载页面
    window.history.pushState({}, '', `/user-manual/${newLang}`);
    window.location.reload();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-black)' }}>
      <HeaderBar
        onLoginClick={() => {}}
        isLoggedIn={false}
        isHomePage={false}
        currentPage="user-manual"
        language={language}
        onLanguageChange={() => {}} // 我们在这里有自己的语言切换
        onPageChange={(page) => {
          if (page === 'competition') {
            window.location.href = '/competition';
          }
        }}
      />

      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '1200px' }}>
        {/* 页面标题和语言切换 */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--brand-light-gray)' }}>
            用户手册
          </h1>

          {/* 语言切换按钮 */}
          <div className="flex gap-2">
            <button
              onClick={() => handleLanguageChange('zh')}
              className={`px-4 py-2 rounded transition-all ${
                currentLang === 'zh' ? 'bg-[#F0B90B] text-black font-semibold' : 'bg-[#222] text-gray-400 hover:bg-[#333]'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-2 rounded transition-all ${
                currentLang === 'en' ? 'bg-[#F0B90B] text-black font-semibold' : 'bg-[#222] text-gray-400 hover:bg-[#333]'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* 用户手册内容 */}
        <div
          className="p-8 rounded-lg"
          style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
        >
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#F0B90B] mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>正在加载用户手册...</p>
            </div>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              className="prose prose-lg prose-invert max-w-none"
              style={{
                color: 'var(--brand-light-gray)',
                fontSize: '16px',
                lineHeight: '1.8'
              }}
            />
          )}
        </div>

        {/* 返回按钮 */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: 'var(--brand-yellow)',
              color: 'var(--brand-black)'
            }}
          >
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
