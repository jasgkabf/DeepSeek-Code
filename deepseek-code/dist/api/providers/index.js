"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeProvider = exports.OpenAIProvider = exports.LLMProviderBase = void 0;
exports.createProvider = createProvider;
const openai_1 = require("./openai");
const claude_1 = require("./claude");
var base_1 = require("./base");
Object.defineProperty(exports, "LLMProviderBase", { enumerable: true, get: function () { return base_1.LLMProviderBase; } });
var openai_2 = require("./openai");
Object.defineProperty(exports, "OpenAIProvider", { enumerable: true, get: function () { return openai_2.OpenAIProvider; } });
var claude_2 = require("./claude");
Object.defineProperty(exports, "ClaudeProvider", { enumerable: true, get: function () { return claude_2.ClaudeProvider; } });
function createProvider(config) {
    switch (config.provider) {
        case 'claude':
            return new claude_1.ClaudeProvider(config);
        case 'openai':
        default:
            return new openai_1.OpenAIProvider(config);
    }
}
//# sourceMappingURL=index.js.map