// This is a higher-order function. It takes an async function (like our controllers), 
// executes it, and if it throws ANY error, it automatically forwards it to next(err).
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

module.exports = asyncHandler;
