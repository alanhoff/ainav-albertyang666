-- AI 生成的工具详情内容（使用场景/快速开始），独立于 tools 表，
-- JSON 基线工具（tools 表中无对应行）也可以生成内容
CREATE TABLE IF NOT EXISTS public.tool_content (
  service_id VARCHAR(255) PRIMARY KEY,
  -- content 格式: {"zh": {"useCases": ["..."], "quickStart": ["..."]}, "en": {...}, ...}
  content JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tool_content ENABLE ROW LEVEL SECURITY;

-- 所有人可读，仅 service role 可写
CREATE POLICY "tool_content_read_all" ON public.tool_content FOR SELECT USING (true);
CREATE POLICY "tool_content_insert_internal" ON public.tool_content FOR INSERT WITH CHECK (false);
CREATE POLICY "tool_content_update_internal" ON public.tool_content FOR UPDATE USING (false);
CREATE POLICY "tool_content_delete_internal" ON public.tool_content FOR DELETE USING (false);
