export async function getMarkingDetails(exam_session_id, examinee_id = -1) {
  try {
    const response = await fetch(`/api/mark/getMarkingDetails?session_id=${exam_session_id}&examinee_id=${examinee_id}`, {
      method: 'GET',
      credentials: 'include',
      // headers: {
      //   'Content-Type': 'application/json',
      //   // 'Authorization': `Bearer ${process.env.API_KEY}`
      // }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch marking details: ' + await response.text());
    }
    if (response.ok) {
      return await response.json();
    }

  } catch (e) {
    console.error(e)
    throw new Error(e)
  }
}

export async function saveMarkingScore(data) {
  try {
    console.log(data)
    const response = await fetch(`/api/mark/saveMarkingScore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to save marking scores: ' + await response.text());
    }
    if (response.ok) {
      return {};
    }
  } catch (e) {
    console.error(e)
    throw new Error(e)
  }
}