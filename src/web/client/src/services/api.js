const API_BASE = "/api";

class ApiService {
  /**
   * Get list of available tools
   */
  async getTools() {
    const response = await fetch(`${API_BASE}/tools`);
    if (!response.ok) throw new Error("Failed to fetch tools");
    return response.json();
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName, input, options = {}) {
    const response = await fetch(`${API_BASE}/tools/${toolName}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, options }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Execution failed");
    }

    return response.json();
  }

  /**
   * Upload and execute tool
   */
  async uploadFile(toolName, file, options = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("options", JSON.stringify(options));

    const response = await fetch(`${API_BASE}/tools/${toolName}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  }

  /**
   * Stream tool execution via SSE
   */
  streamTool(toolName, input, options = {}, callbacks = {}) {
    const params = new URLSearchParams({
      input,
      provider: options.provider || "",
      model: options.model || "",
    });

    const eventSource = new EventSource(
      `${API_BASE}/tools/${toolName}/stream?${params}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "start":
          callbacks.onStart?.(data);
          break;
        case "chunk":
          callbacks.onChunk?.(data.text);
          break;
        case "done":
          callbacks.onDone?.();
          eventSource.close();
          break;
        case "error":
          callbacks.onError?.(new Error(data.error));
          eventSource.close();
          break;
      }
    };

    eventSource.onerror = (error) => {
      callbacks.onError?.(error);
      eventSource.close();
    };

    return {
      close: () => eventSource.close(),
    };
  }

  /**
   * Get configuration
   */
  async getConfig() {
    const response = await fetch(`${API_BASE}/config`);
    if (!response.ok) throw new Error("Failed to fetch config");
    return response.json();
  }

  /**
   * Update configuration
   */
  async updateConfig(key, value) {
    const response = await fetch(`${API_BASE}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });

    if (!response.ok) throw new Error("Failed to update config");
    return response.json();
  }

  /**
   * Test provider availability
   */
  async testProvider(provider, model) {
    const response = await fetch(`${API_BASE}/config/test-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model }),
    });

    if (!response.ok) throw new Error("Failed to test provider");
    return response.json();
  }

  /**
   * Get available providers
   */
  async getProviders() {
    const response = await fetch(`${API_BASE}/providers`);
    if (!response.ok) throw new Error("Failed to fetch providers");
    return response.json();
  }

  /**
   * Get models for provider
   */
  async getModels(provider) {
    const response = await fetch(`${API_BASE}/providers/${provider}/models`);
    if (!response.ok) throw new Error("Failed to fetch models");
    return response.json();
  }
}

export default new ApiService();
