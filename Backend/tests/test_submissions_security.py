"""
Critical security tests for the submission endpoints.

These verify the auth holes from the original codebase have been closed:
- /submissions/run requires auth
- /submissions/submit requires auth
- user_id is taken from the authenticated session, NOT from request body
"""
from unittest.mock import patch


def _signup_and_login(client, *, username="alice", email="alice@example.com"):
    client.post(
        "/auth/signup",
        json={"username": username, "email": email, "password": "Password1"},
    )
    r = client.post(
        "/auth/login",
        data={"username": email, "password": "Password1"},
    )
    return r.json()["access_token"]


def test_run_endpoint_requires_authentication(client):
    """The OLD bug: /execute/run accepted user_id from body, no auth."""
    r = client.post(
        "/submissions/run",
        json={"language": "python", "code": "print('hi')"},
    )
    assert r.status_code == 401


def test_submit_endpoint_requires_authentication(client):
    r = client.post(
        "/submissions/submit",
        json={"problem_id": 1, "language": "python", "code": "x = 1"},
    )
    assert r.status_code == 401


def test_submit_uses_authenticated_user_not_body(client, db_session):
    """Even if a malicious client sends user_id in the body, the recorded
    submission must belong to the authenticated user."""
    # Create two users; 'alice' is the attacker, 'victim' is the target.
    token_alice = _signup_and_login(client, username="alice", email="alice@example.com")
    client.post(
        "/auth/signup",
        json={"username": "victim", "email": "victim@example.com", "password": "Password1"},
    )

    # Add a problem to submit against.
    from app.problems.models.problem import Problem
    from app.core.database import SessionLocal
    with SessionLocal() as db:
        p = Problem(title="Two Sum", description="Sum two numbers.", difficulty="Easy")
        db.add(p)
        db.commit()
        db.refresh(p)
        problem_id = p.id
        from app.auth.models.user import User
        victim = db.query(User).filter_by(username="victim").first()
        victim_id = victim.id

    # Mock the runner so we don't need a real one.
    with patch("app.submissions.services.submission_service.runner_client.run") as mock_run:
        mock_run.return_value = {"stdout": "ok", "stderr": "", "exit_code": 0, "runtime_ms": 5}

        # Alice tries to claim user_id=victim_id in the body. Should be ignored.
        r = client.post(
            "/submissions/submit",
            json={
                "problem_id": problem_id,
                "language": "python",
                "code": "print('hi')",
                "user_id": victim_id,  # ← attempted impersonation
            },
            headers={"Authorization": f"Bearer {token_alice}"},
        )
        assert r.status_code == 200, r.text
        body = r.json()

    # The recorded submission must be Alice's, not the victim's.
    from app.auth.models.user import User
    from app.submissions.models.submission import ProblemSubmission
    with SessionLocal() as db:
        alice = db.query(User).filter_by(username="alice").first()
        sub = db.query(ProblemSubmission).filter_by(id=body["id"]).first()
        assert sub.user_id == alice.id
        assert sub.user_id != victim_id


def test_run_with_auth_returns_runner_output(client):
    token = _signup_and_login(client)
    with patch("app.submissions.services.submission_service.runner_client.run") as mock_run:
        mock_run.return_value = {"stdout": "hello\n", "stderr": "", "exit_code": 0, "runtime_ms": 10}
        r = client.post(
            "/submissions/run",
            json={"language": "python", "code": "print('hello')"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 200
    assert r.json()["stdout"] == "hello\n"
    assert r.json()["exit_code"] == 0
