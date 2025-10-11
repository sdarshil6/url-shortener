import logging
from logging.handlers import RotatingFileHandler
import sys
import os


def setup_logging():
    """Configures the application's logging system."""

    LOGS_DIR = "logs"
    if not os.path.exists(LOGS_DIR):
        os.makedirs(LOGS_DIR)
    log_file_path = os.path.join(LOGS_DIR, "app.log")
    log_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    log_file_handler = RotatingFileHandler(
        log_file_path,
        maxBytes=1*1024*1024,  # 1 Megabyte
        backupCount=5
    )
    log_file_handler.setFormatter(log_formatter)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_formatter)

    root_logger = logging.getLogger()

    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(log_file_handler)
    root_logger.addHandler(console_handler)
