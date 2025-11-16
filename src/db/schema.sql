-- ============================================
-- 红楼小说平台数据库 Schema
-- PostgreSQL 数据库表结构定义
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    password_hash VARCHAR(255), -- 如果使用密码登录
    google_id VARCHAR(255) UNIQUE, -- Google OAuth ID
    role VARCHAR(50) DEFAULT 'user', -- user, admin
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================
-- 2. 小说表 (novels)
-- ============================================
CREATE TABLE novels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100) NOT NULL CHECK (genre IN (
        '玄幻·奇幻', '都市·现实', '仙侠·武侠', '历史·军事', 
        '科幻·游戏', '悬疑·惊悚', '古代言情', '现代言情', 
        '二次元·衍生', '其他分类'
    )),
    cover_image TEXT,
    status VARCHAR(50) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
    is_published BOOLEAN DEFAULT true,
    tags TEXT[], -- PostgreSQL 数组类型
    total_chapters INTEGER DEFAULT 0,
    reads_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    content_updated_date TIMESTAMP,
    -- 区块链相关字段
    bc_contract_address VARCHAR(255) UNIQUE,
    bc_author_address VARCHAR(255),
    bc_pseudonym VARCHAR(255),
    bc_synopsis_cid TEXT,
    bc_logo_cid TEXT,
    bc_registry_address VARCHAR(255),
    -- 元数据
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_novels_is_published ON novels(is_published);
CREATE INDEX idx_novels_genre ON novels(genre);
CREATE INDEX idx_novels_status ON novels(status);
CREATE INDEX idx_novels_bc_author_address ON novels(bc_author_address);
CREATE INDEX idx_novels_created_date ON novels(created_date DESC);
CREATE INDEX idx_novels_content_updated_date ON novels(content_updated_date DESC);
CREATE INDEX idx_novels_rating ON novels(rating DESC);
CREATE INDEX idx_novels_reads_count ON novels(reads_count DESC);

-- ============================================
-- 3. 章节表 (chapters)
-- ============================================
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT false,
    -- 区块链相关字段
    bc_novel_contract_address VARCHAR(255),
    bc_chapter_identifier VARCHAR(255),
    bc_content_cid TEXT,
    -- 元数据
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 唯一约束：同一小说的章节号不能重复
    UNIQUE(novel_id, chapter_number)
);

CREATE INDEX idx_chapters_novel_id ON chapters(novel_id);
CREATE INDEX idx_chapters_novel_id_chapter_number ON chapters(novel_id, chapter_number);
CREATE INDEX idx_chapters_published ON chapters(published);
CREATE INDEX idx_chapters_bc_novel_contract_address ON chapters(bc_novel_contract_address);

-- ============================================
-- 4. 阅读进度表 (reading_progress)
-- ============================================
CREATE TABLE reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    current_chapter INTEGER DEFAULT 1,
    progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_read_date TIMESTAMP,
    is_favorite BOOLEAN DEFAULT false,
    reading_status VARCHAR(50) DEFAULT 'reading' CHECK (reading_status IN ('reading', 'completed', 'plan-to-read', 'dropped')),
    last_read_paragraph_index INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 唯一约束：一个用户对一部小说只能有一条阅读进度
    UNIQUE(user_id, novel_id)
);

CREATE INDEX idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX idx_reading_progress_novel_id ON reading_progress(novel_id);
CREATE INDEX idx_reading_progress_user_novel ON reading_progress(user_id, novel_id);
CREATE INDEX idx_reading_progress_reading_status ON reading_progress(reading_status);
CREATE INDEX idx_reading_progress_is_favorite ON reading_progress(is_favorite);

-- ============================================
-- 5. 评论表 (comments)
-- ============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('novel', 'chapter', 'paragraph')),
    target_id UUID NOT NULL,
    paragraph_index INTEGER, -- 段落索引（仅当 target_type = 'paragraph' 时使用）
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 父评论ID（用于回复）
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_target_type_target_id ON comments(target_type, target_id);
CREATE INDEX idx_comments_target_id ON comments(target_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_date ON comments(created_date DESC);

-- ============================================
-- 6. 点赞表 (likes)
-- ============================================
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 唯一约束：一个用户对一条评论只能点赞一次
    UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_comment_id ON likes(comment_id);
CREATE INDEX idx_likes_user_comment ON likes(user_id, comment_id);

-- ============================================
-- 7. 评分表 (ratings)
-- ============================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 唯一约束：一个用户对一部小说只能评分一次
    UNIQUE(user_id, novel_id)
);

CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_novel_id ON ratings(novel_id);
CREATE INDEX idx_ratings_user_novel ON ratings(user_id, novel_id);

-- ============================================
-- 8. 作者资料表 (author_profiles)
-- ============================================
CREATE TABLE author_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bc_address VARCHAR(255) UNIQUE NOT NULL, -- 区块链地址作为唯一标识
    pseudonym VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    external_url TEXT,
    -- 区块链相关字段
    bc_metadata_cid TEXT,
    bc_bio_cid TEXT,
    bc_avatar_cid TEXT,
    bc_cover_cid TEXT,
    -- 状态字段
    is_celebrity BOOLEAN DEFAULT false,
    is_kyc BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    -- 时间戳（使用数字类型，兼容原定义）
    create_time BIGINT, -- Unix 时间戳（毫秒）
    update_time BIGINT, -- Unix 时间戳（毫秒）
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_author_profiles_bc_address ON author_profiles(bc_address);
CREATE INDEX idx_author_profiles_is_celebrity ON author_profiles(is_celebrity);
CREATE INDEX idx_author_profiles_is_active ON author_profiles(is_active);

-- ============================================
-- 触发器：自动更新 updated_date
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加自动更新 updated_date 的触发器
CREATE TRIGGER update_users_updated_date BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TRIGGER update_novels_updated_date BEFORE UPDATE ON novels
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TRIGGER update_chapters_updated_date BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TRIGGER update_reading_progress_updated_date BEFORE UPDATE ON reading_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TRIGGER update_comments_updated_date BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TRIGGER update_ratings_updated_date BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

CREATE TRIGGER update_author_profiles_updated_date BEFORE UPDATE ON author_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

-- ============================================
-- 视图：小说统计视图（包含平均评分、总评论数等）
-- ============================================
CREATE OR REPLACE VIEW novel_stats AS
SELECT 
    n.id,
    n.title,
    n.rating as avg_rating,
    COUNT(DISTINCT r.id) as rating_count,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT rp.id) as reader_count,
    COUNT(DISTINCT CASE WHEN rp.is_favorite = true THEN rp.id END) as favorite_count
FROM novels n
LEFT JOIN ratings r ON n.id = r.novel_id
LEFT JOIN comments c ON c.target_type = 'novel' AND c.target_id = n.id
LEFT JOIN reading_progress rp ON n.id = rp.novel_id
WHERE n.is_published = true
GROUP BY n.id, n.title, n.rating;

-- ============================================
-- 函数：更新小说平均评分
-- ============================================
CREATE OR REPLACE FUNCTION update_novel_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE novels
    SET rating = (
        SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
        FROM ratings
        WHERE novel_id = COALESCE(NEW.novel_id, OLD.novel_id)
    )
    WHERE id = COALESCE(NEW.novel_id, OLD.novel_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_novel_rating_on_rating_change
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_novel_rating();

-- ============================================
-- 函数：更新评论的回复数
-- ============================================
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
        UPDATE comments
        SET replies_count = replies_count + 1
        WHERE id = NEW.parent_comment_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
        UPDATE comments
        SET replies_count = GREATEST(replies_count - 1, 0)
        WHERE id = OLD.parent_comment_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comment_replies_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_replies_count();

-- ============================================
-- 函数：更新评论的点赞数
-- ============================================
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.comment_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comment_likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- ============================================
-- 函数：更新小说的总章节数
-- ============================================
CREATE OR REPLACE FUNCTION update_novel_total_chapters()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE novels
    SET total_chapters = (
        SELECT COUNT(*)
        FROM chapters
        WHERE novel_id = COALESCE(NEW.novel_id, OLD.novel_id)
        AND published = true
    )
    WHERE id = COALESCE(NEW.novel_id, OLD.novel_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_novel_total_chapters_trigger
    AFTER INSERT OR UPDATE OR DELETE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_novel_total_chapters();

