#!/usr/bin/env python3
"""
Script to close all open pull requests in the repository using PyGithub.
"""

import os
import sys
from github import Github, GithubException

def main():
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("ERROR: GITHUB_TOKEN environment variable is not set")
        sys.exit(1)
    
    repo_name = "DopestT/HALO-Go-Live-Be-Seen"
    current_pr = 22  # PR to skip
    
    print("Initializing GitHub client...")
    try:
        g = Github(token)
        repo = g.get_repo(repo_name)
    except GithubException as e:
        print(f"ERROR: Failed to connect to GitHub: {e}")
        sys.exit(1)
    
    print(f"Fetching open pull requests for {repo_name}...")
    try:
        pulls = repo.get_pulls(state='open')
        pr_list = list(pulls)
    except GithubException as e:
        print(f"ERROR: Failed to fetch PRs: {e}")
        sys.exit(1)
    
    if not pr_list:
        print("No open pull requests found.")
        return
    
    print(f"\nFound {len(pr_list)} open PR(s):")
    for pr in pr_list:
        print(f"  - PR #{pr.number}: {pr.title}")
    
    print("\nClosing pull requests...")
    closed_count = 0
    failed_count = 0
    
    for pr in pr_list:
        if pr.number == current_pr:
            print(f"Skipping PR #{pr.number} (current working PR)")
            continue
        
        try:
            print(f"Closing PR #{pr.number}...", end=' ')
            
            # Add a comment
            try:
                pr.create_issue_comment("Closing all pull requests as requested.")
            except GithubException:
                pass  # Comment is optional
            
            # Close the PR
            pr.edit(state='closed')
            print("✓ SUCCESS")
            closed_count += 1
            
        except GithubException as e:
            print(f"✗ FAILED: {e}")
            failed_count += 1
    
    print(f"\n=== Summary ===")
    print(f"Successfully closed: {closed_count}")
    print(f"Failed: {failed_count}")
    print(f"Skipped: {1 if any(pr.number == current_pr for pr in pr_list) else 0}")

if __name__ == "__main__":
    main()
