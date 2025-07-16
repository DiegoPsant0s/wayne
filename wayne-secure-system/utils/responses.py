from fastapi.responses import JSONResponse

def success_response(data=None, message="Operação realizada com sucesso", status_code=200):
    return JSONResponse(content={
        "success": True,
        "message": message,
        "data": data
    }, status_code=status_code)

def error_response(message="Ocorreu um erro", status_code=400, data=None):
    return JSONResponse(content={
        "success": False,
        "message": message,
        "data": data
    }, status_code=status_code)
