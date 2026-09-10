# Portfolio skill (pointer)

The operational skill for this site is the global Claude Code skill `portfolio`:

- Skill: `C:\Users\user\.claude\skills\portfolio\SKILL.md` (invoke with `/portfolio`)
- Reference: `C:\Users\user\.claude\skills\portfolio\reference.md`
- CLI: `python "C:/Users/user/.claude/skills/portfolio/scripts/portfolio.py" --help`

It covers publishing posts straight to R2, Gemini cover images, LinkedIn sharing, editing/renaming/deleting posts, health checks, deploys, LinkedIn re-auth, adding projects, and the currently known problems (admin key drift, dead SMTP host, uncommitted image-route fix, retired LinkedIn API version).

This file is only a pointer so the skill is discoverable from inside the repo. Flat `.md` files in `.claude/skills/` are not loaded as skills; the real skill uses the `portfolio/SKILL.md` directory format.
