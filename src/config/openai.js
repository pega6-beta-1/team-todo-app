/**
 * OpenAI API utilities
 */

// Get the API key from environment variables
const getApiKey = () => {
  // Use Vite's built-in import.meta.env for accessing environment variables
  if (import.meta?.env?.VITE_OPENAI_API_KEY) {
    return import.meta.env.VITE_OPENAI_API_KEY;
  }
  
  console.warn('OpenAI API key not found in environment variables');
  // Fallback to localStorage if needed
  return localStorage.getItem('openai_api_key');
};

/**
 * Call the OpenAI API with the provided prompt
 * @param {string} prompt - The prompt to send to OpenAI
 * @returns {Promise<Object>} - The response from OpenAI
 */
export async function generateAITasks(activityDescription) {
  const prompt = `Break down the following activity into 5-10 specific tasks that would help complete it. 
  Format your response as a JSON array of task objects with 'text' and 'description' properties.
  Also include a short category name (3-4 words max) that summarizes this activity.
  
  Activity: ${activityDescription}
  
  Response format example:
  {
    "categoryName": "Weekend Beach Trip",
    "tasks": [
      {
        "text": "Research beach locations",
        "description": "Look up beaches within driving distance and check reviews"
      },
      {
        "text": "Pack beach essentials",
        "description": "Sunscreen, towels, umbrella, snacks, water, etc."
      }
    ]
  }`;

  try {
    // Call ChatGPT API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getApiKey()}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to generate tasks");
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content returned from AI");
    }
    
    // Parse the JSON response
    // The AI might sometimes include markdown code blocks, so we need to clean that up
    const jsonString = content.replace(/```json|```/g, "").trim();
    const parsedResponse = JSON.parse(jsonString);
    
    return {
      categoryName: parsedResponse.categoryName,
      tasks: parsedResponse.tasks.map(task => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        text: task.text,
        description: task.description || "",
        completed: false
      }))
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to generate tasks. Please try again later.");
  }
} 