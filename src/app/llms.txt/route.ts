import { getAllCategories, getAllAIServices } from '@/lib/data';
import { locales } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://www.ainav.space';
  const categories = getAllCategories();
  const services = await getAllAIServices('en');

  const llmsTxt = `# AINav - AI Tools Directory

> ainav.space is a curated, multilingual AI tools directory that helps users discover the best AI software for writing, image generation, video creation, coding, productivity, and more. We organize free and paid AI tools by category, with ratings, reviews, and detailed feature descriptions to help users find the right AI productivity tools.
>
> Last updated: ${new Date().toISOString().split('T')[0]}
> Languages supported: English (en), 中文 (zh), 日本語 (ja), 한국어 (ko), Français (fr)

## Core Pages

- [Homepage](${baseUrl}/en) - Main entry point with featured AI tools and category overview
- [AI Tools Directory](${baseUrl}/en/tools) - Complete list of all curated AI tools
- [Search AI Tools](${baseUrl}/en/search) - Search and filter tools by category, pricing, and features
- [Submit AI Tool](${baseUrl}/en/submit) - Submit a new AI tool for inclusion in the directory
- [About Us](${baseUrl}/en/about) - Project mission, values, and team information
- [Privacy Policy](${baseUrl}/en/privacy) - Data handling and privacy practices
- [Terms of Service](${baseUrl}/en/terms) - Usage terms and conditions

## Tool Categories

${categories.map(cat => `- [${cat.name}](${baseUrl}/en/category/${cat.id}) - ${cat.description}`).join('\n')}

## Featured AI Tools

${services.slice(0, 20).map(s => `- [${s.name}](${baseUrl}/en/service/${s.id}) - ${s.description?.slice(0, 120) || ''}`).join('\n')}

## Language Versions

- [English](${baseUrl}/en) - Default English version
- [中文](${baseUrl}/zh) - Chinese version
- [日本語](${baseUrl}/ja) - Japanese version
- [한국어](${baseUrl}/ko) - Korean version
- [Français](${baseUrl}/fr) - French version

## For AI Crawlers

- Full content version: [llms-full.txt](${baseUrl}/llms-full.txt)
- Sitemap: [sitemap.xml](${baseUrl}/sitemap.xml)
- This file follows the llms.txt standard proposed by Jeremy Howard (Answer.AI)
- All content is curated and human-reviewed for quality
`;

  return new Response(llmsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
