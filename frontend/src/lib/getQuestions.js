export async function getQuestions() {
  try {
    const response = await fetch("http://localhost:4002/questions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch questions:", response.status);
      return [];
    }

    const data = await response.json();
    return data; // Expecting array of { QID, title, difficulty, topics }
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
}
