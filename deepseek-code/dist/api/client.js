"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = void 0;
exports.chatCompletionStream = chatCompletionStream;
exports.chatCompletion = chatCompletion;
const providers_1 = require("./providers");
var providers_2 = require("./providers");
Object.defineProperty(exports, "createProvider", { enumerable: true, get: function () { return providers_2.createProvider; } });
async function chatCompletionStream(messages, tools, config, callbacks) {
    const provider = (0, providers_1.createProvider)(config);
    return provider.chatCompletionStream(messages, tools, callbacks);
}
async function chatCompletion(messages, tools, config) {
    const provider = (0, providers_1.createProvider)(config);
    return provider.chatCompletion(messages, tools);
}
//# sourceMappingURL=client.js.map