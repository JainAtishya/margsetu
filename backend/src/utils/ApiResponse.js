class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        // If status code is less than 400, it's a success!
        this.success = statusCode < 400; 
    }
}

module.exports = ApiResponse;
