from celery import shared_task
import time

@shared_task
def process_user_analytics(user_id):
    """
    A sample Celery task to demonstrate background processing.
    This simulates a long-running task like compiling a PDF report or crunching analytics.
    """
    print(f"Starting analytics processing for user {user_id}...")
    time.sleep(5)  # Simulate heavy computation or external API call
    print(f"Analytics successfully processed for user {user_id}!")
    return f"Success user {user_id}"
