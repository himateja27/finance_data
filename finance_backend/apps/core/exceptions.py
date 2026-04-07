"""
Custom REST framework exception handler and error responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats error responses consistently.
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        error_response = {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': str(response.data) if isinstance(response.data, (list, dict)) and response.data else str(exc),
                'details': response.data
            }
        }
        response.data = error_response
    
    return response


def error_response(message, code, status_code=status.HTTP_400_BAD_REQUEST, details=None):
    """
    Helper function to create standardized error responses.
    """
    return Response(
        {
            'success': False,
            'error': {
                'code': code,
                'message': message,
                'details': details or {}
            }
        },
        status=status_code
    )


def success_response(data, message='Success', status_code=status.HTTP_200_OK):
    """
    Helper function to create standardized success responses.
    """
    return Response(
        {
            'success': True,
            'message': message,
            'data': data
        },
        status=status_code
    )
