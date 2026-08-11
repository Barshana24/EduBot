"""Daily-login rewards.

Called on every authenticated entry point, so a student who stays signed in
still gets credited when they come back the next day rather than only on an
explicit sign-in.
"""
import logging
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.user import User

logger = logging.getLogger(__name__)

XP_PER_LOGIN_DAY = 10


def credit_daily_login(db: Session, user: User) -> dict:
    """
    Award the day's login if it hasn't been awarded yet.

    Returns what happened so the client can celebrate a genuinely new day
    instead of firing an animation on every page load.
    """
    today = date.today()
    last = user.last_login_date

    if last == today:
        return {
            "awarded": False,
            "streak_days": user.streak_days or 0,
            "login_days": user.login_days or 0,
            "xp_awarded": 0,
        }

    if last is None:
        streak = 1
    elif last == today - timedelta(days=1):
        streak = (user.streak_days or 0) + 1
    else:
        # Missed at least one day, so the run restarts at today.
        streak = 1

    user.streak_days = streak
    user.login_days = (user.login_days or 0) + 1
    user.last_login_date = today
    user.longest_streak = max(user.longest_streak or 0, streak)

    db.commit()
    db.refresh(user)

    logger.info(
        "Daily login credited for user %s: streak=%d login_days=%d",
        user.id, streak, user.login_days,
    )

    return {
        "awarded": True,
        "streak_days": streak,
        "login_days": user.login_days,
        "xp_awarded": XP_PER_LOGIN_DAY,
    }
