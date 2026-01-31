import logging
from logging.handlers import RotatingFileHandler
import sys
import os
import json
import uuid
from datetime import datetime, timezone
from contextvars import ContextVar
from typing import Optional

# Context variable for request correlation ID
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
request_context_var: ContextVar[Optional[dict]] = ContextVar('request_context', default=None)


def get_request_id() -> Optional[str]:
    """Get the current request correlation ID."""
    return request_id_var.get()


def set_request_id(request_id: str = None) -> str:
    """Set or generate a new request correlation ID."""
    if request_id is None:
        request_id = str(uuid.uuid4())[:8]
    request_id_var.set(request_id)
    return request_id


def get_request_context() -> Optional[dict]:
    """Get the current request context."""
    return request_context_var.get()


def set_request_context(context: dict):
    """Set the request context (user, IP, endpoint, etc.)."""
    request_context_var.set(context)


def clear_request_context():
    """Clear the request context."""
    request_id_var.set(None)
    request_context_var.set(None)


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add correlation ID if available
        request_id = get_request_id()
        if request_id:
            log_entry["correlation_id"] = request_id
        
        # Add request context if available
        context = get_request_context()
        if context:
            log_entry["context"] = context
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add any extra attributes
        if hasattr(record, 'extra_data'):
            log_entry["data"] = record.extra_data
        
        return json.dumps(log_entry)


class ContextualAdapter(logging.LoggerAdapter):
    """Logger adapter that automatically includes contextual information."""
    
    def process(self, msg, kwargs):
        extra = kwargs.get('extra', {})
        extra_data = extra.pop('extra_data', None)
        
        if extra_data:
            kwargs['extra'] = {**extra, 'extra_data': extra_data}
        
        return msg, kwargs


def get_logger(name: str) -> ContextualAdapter:
    """Get a module-specific logger with contextual adapter."""
    logger = logging.getLogger(name)
    return ContextualAdapter(logger, {})


def get_log_level() -> int:
    """Get log level based on environment."""
    env = os.getenv('ENVIRONMENT', 'development').lower()
    log_level_str = os.getenv('LOG_LEVEL', '').upper()
    
    if log_level_str:
        return getattr(logging, log_level_str, logging.INFO)
    
    level_mapping = {
        'production': logging.WARNING,
        'staging': logging.INFO,
        'development': logging.DEBUG,
        'testing': logging.DEBUG,
    }
    return level_mapping.get(env, logging.INFO)


def setup_logging():
    """Configures the application's logging system with structured JSON logging."""
    
    LOGS_DIR = "logs"
    if not os.path.exists(LOGS_DIR):
        os.makedirs(LOGS_DIR)
    
    log_level = get_log_level()
    env = os.getenv('ENVIRONMENT', 'development').lower()
    
    # JSON formatter for file output
    json_formatter = JSONFormatter()
    
    # Human-readable formatter for console in development
    console_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
    )
    
    # Main application log (JSON format)
    app_log_path = os.path.join(LOGS_DIR, "app.log")
    app_file_handler = RotatingFileHandler(
        app_log_path,
        maxBytes=5*1024*1024,  # 5 Megabytes
        backupCount=10
    )
    app_file_handler.setFormatter(json_formatter)
    app_file_handler.setLevel(log_level)
    
    # Error-only log for quick issue identification
    error_log_path = os.path.join(LOGS_DIR, "error.log")
    error_file_handler = RotatingFileHandler(
        error_log_path,
        maxBytes=5*1024*1024,
        backupCount=10
    )
    error_file_handler.setFormatter(json_formatter)
    error_file_handler.setLevel(logging.ERROR)
    
    # Security/audit log for auth events
    audit_log_path = os.path.join(LOGS_DIR, "audit.log")
    audit_file_handler = RotatingFileHandler(
        audit_log_path,
        maxBytes=5*1024*1024,
        backupCount=10
    )
    audit_file_handler.setFormatter(json_formatter)
    audit_file_handler.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    if env == 'production':
        console_handler.setFormatter(json_formatter)
    else:
        console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)  # Capture all, let handlers filter
    root_logger.addHandler(app_file_handler)
    root_logger.addHandler(error_file_handler)
    root_logger.addHandler(console_handler)
    
    # Configure audit logger
    audit_logger = logging.getLogger('audit')
    audit_logger.addHandler(audit_file_handler)
    audit_logger.setLevel(logging.INFO)
    audit_logger.propagate = False  # Don't duplicate to root
    
    # Configure module-specific loggers with appropriate levels
    module_loggers = {
        'crud': logging.DEBUG,
        'auth': logging.DEBUG,
        'email_utils': logging.DEBUG,
        'enrichment': logging.DEBUG,
        'main': logging.DEBUG,
        'uvicorn': logging.INFO,
        'sqlalchemy.engine': logging.WARNING,
    }
    
    for module_name, level in module_loggers.items():
        module_logger = logging.getLogger(module_name)
        module_logger.setLevel(level)
    
    # Log startup information
    root_logger.info(f"Logging initialized - Environment: {env}, Level: {logging.getLevelName(log_level)}")
