class ApiError extends Error {
    constructor(
        statusCode,
        message= "something went wrong",
        error= [],
        statck= ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data
        this.message
        this.success= false
        this.errors=errors

        if(stack){
            this.stack= statck
        } else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}