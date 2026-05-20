-- Feature: Dynamic Landing Page Articles (Portfolio/Milestones)
-- Creates a table to allow organizations to showcase dynamic content on their public landing pages.

CREATE TABLE IF NOT EXISTS landing_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Index for efficient querying by organization and ordering
CREATE INDEX IF NOT EXISTS landing_articles_organization_id_idx ON landing_articles(organization_id);
CREATE INDEX IF NOT EXISTS landing_articles_order_index_idx ON landing_articles(order_index);

-- RLS Policies
ALTER TABLE landing_articles ENABLE ROW LEVEL SECURITY;

-- 1. Public can view articles for any organization
CREATE POLICY "Public read access to landing articles"
    ON landing_articles FOR SELECT
    USING (true);

-- 2. Organization members can manage their own articles
CREATE POLICY "Organization members manage landing articles"
    ON landing_articles FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );
