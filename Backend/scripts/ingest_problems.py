#!/usr/bin/env python3
"""Ingest ALL problems from frontend JSON files into the database.

This script:
1. Scans frontend/public/problems for all problem JSON files
2. Creates Problem records in the database if they don't exist
3. Seeds their test cases

Run:
    python scripts/ingest_problems.py
"""
import json
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.problems.models.problem import Problem, ProblemTestCase

# Create DB connection
settings = get_settings()
engine = create_engine(str(settings.DATABASE_URL))
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def ingest_problems_from_frontend():
    """Scan frontend problem files and create Problem records."""
    try:
        # Try multiple possible frontend paths
        possible_paths = [
            Path("/app/frontend_problems"),  # Mounted from docker-compose.yml
            Path("/app/../frontend/public/problems"),
            Path("/frontend/public/problems"),
            Path("../frontend/public/problems"),
            Path("/workspace/frontend/public/problems"),
        ]
        
        problems_dir = None
        for path in possible_paths:
            if path.exists():
                problems_dir = path
                break
        
        if not problems_dir:
            print(f"⚠ Frontend problems directory not found")
            return False
        
        print(f"📂 Scanning {problems_dir}...")
        
        # Get all JSON files
        problem_files = sorted(
            list(problems_dir.glob("*/*.json")) + list(problems_dir.glob("*.json"))
        )
        print(f"📝 Found {len(problem_files)} problem files\n")
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for idx, problem_file in enumerate(problem_files, 1):
            try:
                with open(problem_file, 'r', encoding='utf-8') as f:
                    problem_data = json.load(f)
                
                problem_title = problem_data.get("title", "").strip()
                problem_slug = problem_data.get("slug", "").strip()
                problem_desc = problem_data.get("description", "").strip()
                problem_difficulty = problem_data.get("difficulty", "Easy").strip()
                
                if not problem_title:
                    skipped_count += 1
                    continue
                
                # Check if problem exists by slug or title
                existing_problem = None
                if problem_slug:
                    existing_problem = db.query(Problem).filter(
                        Problem.slug == problem_slug
                    ).first()
                
                if not existing_problem:
                    existing_problem = db.query(Problem).filter(
                        Problem.title == problem_title
                    ).first()
                
                # Create or update problem
                if existing_problem:
                    # Update description if empty
                    if not existing_problem.description and problem_desc:
                        existing_problem.description = problem_desc
                    updated_count += 1
                else:
                    # Create new problem
                    new_problem = Problem(
                        title=problem_title,
                        slug=problem_slug or problem_title.lower().replace(" ", "-"),
                        description=problem_desc,
                        difficulty=problem_difficulty,
                    )
                    db.add(new_problem)
                    db.flush()  # Get the ID
                    existing_problem = new_problem
                    created_count += 1
                
                # Seed test cases if they don't exist
                existing_tests = db.query(ProblemTestCase).filter(
                    ProblemTestCase.problem_id == existing_problem.id
                ).count()
                
                if existing_tests == 0:
                    # Extract test cases from examples
                    examples = problem_data.get("examples", [])
                    for example in examples:
                        if isinstance(example, dict):
                            input_val = example.get("input") or example.get("input_data")
                            output_val = example.get("output") or example.get("output_data")
                            
                            if input_val is not None and output_val is not None:
                                test_case = ProblemTestCase(
                                    problem_id=existing_problem.id,
                                    input=str(input_val),
                                    expected_output=str(output_val),
                                    is_hidden=False,
                                )
                                db.add(test_case)
                    
                    # If no examples, add a placeholder
                    if not examples:
                        test_case = ProblemTestCase(
                            problem_id=existing_problem.id,
                            input="",
                            expected_output="",
                            is_hidden=False,
                        )
                        db.add(test_case)
                
                # Commit every 50 to avoid memory issues
                if idx % 50 == 0:
                    db.commit()
                    print(f"✓ Processed {idx} problems... (Created: {created_count}, Updated: {updated_count})")
            
            except json.JSONDecodeError as e:
                print(f"  ⚠ Skipping {problem_file}: Invalid JSON - {e}")
                skipped_count += 1
            except Exception as e:
                db.rollback()
                print(f"  ⚠ Error processing {problem_file}: {e}")
                skipped_count += 1
        
        # Final commit
        db.commit()
        
        print(f"\n✅ Ingestion complete!")
        print(f"  - Created: {created_count} new problems")
        print(f"  - Updated: {updated_count} existing problems")
        print(f"  - Skipped: {skipped_count}")
        
        # Show final stats
        total_problems = db.query(Problem).count()
        print(f"\n📊 Database now contains: {total_problems} total problems")
        
        return True
    
    except Exception as e:
        print(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return False

try:
    print("🚀 Starting problem ingestion from frontend...\n")
    ingest_problems_from_frontend()
finally:
    db.close()
