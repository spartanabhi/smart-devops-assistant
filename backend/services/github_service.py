import os
import logging
from datetime import datetime

logger = logging.getLogger("smart-devops-assistant.github-service")

def publish_runbook(filename: str, markdown_content: str) -> dict:
    github_token = os.getenv("GITHUB_TOKEN")
    github_repo = os.getenv("GITHUB_REPO", "spartanabhi/smart-devops-assistant")
    
    # Check if token is missing or is a placeholder
    if not github_token or github_token.startswith("ghp_your"):
        return _mock_publish(filename, github_repo)
        
    try:
        from github import Github
        from github.GithubException import UnknownObjectException
        
        gh = Github(github_token)
        repo = gh.get_repo(github_repo)
        
        github_path = f"runbooks/{filename}"
        commit_message = f"docs: auto-generated runbook {filename}"
        
        try:
            # Check if file already exists to update it
            contents = repo.get_contents(github_path)
            res = repo.update_file(
                path=contents.path,
                message=commit_message,
                content=markdown_content,
                sha=contents.sha
            )
            commit_sha = res["commit"].sha
        except UnknownObjectException:
            # File doesn't exist, create it
            res = repo.create_file(
                path=github_path,
                message=commit_message,
                content=markdown_content
            )
            commit_sha = res["commit"].sha
            
        return {
            "github_url": f"https://github.com/{github_repo}/blob/main/{github_path}",
            "github_commit_sha": commit_sha,
            "github_file_path": github_path,
            "published_at": datetime.utcnow()
        }
    except ImportError:
        logger.error("PyGithub is not installed. Using mock publisher.")
        return _mock_publish(filename, github_repo)
    except Exception as e:
        logger.error(f"Failed to publish to GitHub: {e}")
        return _mock_publish(filename, github_repo)

def _mock_publish(filename: str, repo: str) -> dict:
    logger.info("Using mock GitHub publisher.")
    return {
        "github_url": f"https://github.com/{repo}/blob/main/runbooks/mock.md",
        "github_commit_sha": "mock_sha_1234567890abcdef",
        "github_file_path": f"runbooks/{filename}",
        "published_at": datetime.utcnow()
    }
