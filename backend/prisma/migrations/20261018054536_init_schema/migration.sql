-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "career_level" AS ENUM ('ENTRY', 'JUNIOR', 'MID', 'SENIOR');

-- CreateEnum
CREATE TYPE "experience_level" AS ENUM ('ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD');

-- CreateEnum
CREATE TYPE "skill_category" AS ENUM ('LANGUAGE', 'FRAMEWORK', 'DATABASE', 'DEVOPS', 'CONCEPT', 'TOOL');

-- CreateEnum
CREATE TYPE "match_type" AS ENUM ('MATCHED', 'MISSING_REQUIRED', 'MISSING_PREFERRED');

-- CreateEnum
CREATE TYPE "skill_relevance" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "target_role" VARCHAR(100),
    "career_level" "career_level" NOT NULL DEFAULT 'ENTRY',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "target_role" VARCHAR(100),
    "content" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_descriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "company" VARCHAR(150) NOT NULL,
    "experience_level" "experience_level" NOT NULL DEFAULT 'MID',
    "raw_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_analyses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "job_description_id" UUID NOT NULL,
    "overall_score" SMALLINT NOT NULL,
    "skill_score" SMALLINT NOT NULL,
    "experience_score" SMALLINT NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "model_version" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "resume_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "normalized_name" VARCHAR(100) NOT NULL,
    "category" "skill_category" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_skills" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "match_type" "match_type" NOT NULL,
    "relevance" "skill_relevance" NOT NULL DEFAULT 'MEDIUM',
    "contextual_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_roadmaps" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "target_role" VARCHAR(100) NOT NULL,
    "timeframe" VARCHAR(50) NOT NULL,
    "total_tasks" INTEGER NOT NULL DEFAULT 0,
    "completed_tasks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "career_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_tasks" (
    "id" UUID NOT NULL,
    "roadmap_id" UUID NOT NULL,
    "phase_number" SMALLINT NOT NULL,
    "phase_title" VARCHAR(150) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "order_index" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_resumes_user_id" ON "resumes"("user_id");

-- CreateIndex
CREATE INDEX "idx_resumes_user_primary" ON "resumes"("user_id", "is_primary");

-- CreateIndex
CREATE INDEX "idx_job_descriptions_user_id" ON "job_descriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_resume_analyses_user_id" ON "resume_analyses"("user_id");

-- CreateIndex
CREATE INDEX "idx_resume_analyses_resume_id" ON "resume_analyses"("resume_id");

-- CreateIndex
CREATE INDEX "idx_resume_analyses_job_description_id" ON "resume_analyses"("job_description_id");

-- CreateIndex
CREATE INDEX "idx_resume_analyses_user_created_at" ON "resume_analyses"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_normalized_name_key" ON "skills"("normalized_name");

-- CreateIndex
CREATE INDEX "idx_skills_category" ON "skills"("category");

-- CreateIndex
CREATE INDEX "idx_analysis_skills_analysis_id" ON "analysis_skills"("analysis_id");

-- CreateIndex
CREATE INDEX "idx_analysis_skills_skill_id" ON "analysis_skills"("skill_id");

-- CreateIndex
CREATE INDEX "idx_analysis_skills_match_type" ON "analysis_skills"("match_type");

-- CreateIndex
CREATE UNIQUE INDEX "uq_analysis_skills_analysis_skill" ON "analysis_skills"("analysis_id", "skill_id");

-- CreateIndex
CREATE INDEX "idx_career_roadmaps_user_id" ON "career_roadmaps"("user_id");

-- CreateIndex
CREATE INDEX "idx_career_roadmaps_analysis_id" ON "career_roadmaps"("analysis_id");

-- CreateIndex
CREATE INDEX "idx_career_roadmaps_user_created_at" ON "career_roadmaps"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_roadmap_tasks_roadmap_id" ON "roadmap_tasks"("roadmap_id");

-- CreateIndex
CREATE INDEX "idx_roadmap_tasks_roadmap_order" ON "roadmap_tasks"("roadmap_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_roadmap_tasks_roadmap_phase" ON "roadmap_tasks"("roadmap_id", "phase_number");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_job_description_id_fkey" FOREIGN KEY ("job_description_id") REFERENCES "job_descriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_skills" ADD CONSTRAINT "analysis_skills_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "resume_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_skills" ADD CONSTRAINT "analysis_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_roadmaps" ADD CONSTRAINT "career_roadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_roadmaps" ADD CONSTRAINT "career_roadmaps_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "resume_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "career_roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
