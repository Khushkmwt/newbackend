class apiResponse {
    constructor(statusCode , data,message = "seccess"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}