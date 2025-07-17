export async function getExamineeList(exam_session_id) {
  try {
    const response = await fetch(`/api/mark/getExamineeList?session_id=${exam_session_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${process.env.API_KEY}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch marking details: ' + await response.text());
    }
    if (response.ok) {
      return await response.json();
    }

  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function getExamDetails(exam_session_id) {
  try {
    const response = await fetch(`/api/mark/getExamDetails?session_id=${exam_session_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${process.env.API_KEY}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch marking details: ' + await response.text());
    }
    if (response.ok) {
      return await response.json();
    }

  } catch (e) {
    console.error(e)
    throw e
  }
}


export async function getExamList(query_params) {
  try {
    const response = await fetch(`/api/mark/getExamList?${query_params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      // headers: {
      //   'Content-Type': 'application/json',
      //   // 'Authorization': `Bearer ${process.env.API_KEY}`
      // }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch exam list: ' + await response.text());
    }
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}


export async function startAIMark(session_id) {
  try {
    const response = await fetch(`/api/mark/startAIMark?session_id=${session_id}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch ai mark api: ' + await response.text());
    }
    if (response.ok) {
      return await response;
    }
  } catch (e) {
    console.error(e)
    throw e
  }

}

export async function submitMarkingResult(session_id, mark_mode = "02") {
  try {
    const response = await fetch(`/api/mark/markingResult?session_id=${session_id}&mark_mode=${mark_mode}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch submitMarkingResult api: ' + await response.text())
    }
    if (response.ok) {
      return await response;
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function updateMarkInfoState(session_id) {
  try {
    if (!session_id) {
      throw new Error('session_id is required');
    }

    const response = await fetch(`/api/mark/markInfo?session_id=${session_id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch updateMarkInfoState api: ' + await response.text());
    }
    if (response.ok) {
      return await response;
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function submitCheckedResults(session_id, data) {
  try {
    if (!session_id) {
      throw new Error('session_id is required');
    }

    const response = await fetch(`/api/mark/checkedResults?session_id=${session_id}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch submitCheckedResults api: ' + await response.text());
    }
    if (response.ok) {
      return await response;
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function getPracticeList(query_params) {
  try {
    const response = await fetch(`/api/mark/practice?${query_params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch getPracticeList api: ' + await response.text());
    }
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function submitPracticeResults(data) {
  try {
    if (!data) {
      throw new Error('request body is required');
    }

    const response = await fetch(`/api/mark/practiceResults`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch submitPracticeResults api: ' + await response.text)
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function startPracticeAIMark(ractice_id) {
  try {
    const response = await fetch(`/api/mark/startPracticeAIMark?practice_id=${ractice_id}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch startPracticeAIMark api: ' + await response.text());
    }
    if (response.ok) {
      return await response;
    }
  } catch (e) {
    console.error(e)
    throw e
  }

}

export async function getPracticeMarkingDetails(practice_id, student_id = -1) {
  try {
    const response = await fetch(`/api/mark/practiceMarkingDetails?practice_id=${practice_id}&student_id=${student_id}`, {
      method: 'GET',
      credentials: 'include',
      // headers: {
      //   'Content-Type': 'application/json',
      //   // 'Authorization': `Bearer ${process.env.API_KEY}`
      // }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch practice marking details: ' + await response.text());
    }
    if (response.ok) {
      return await response.json();
    }

  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function submitPracticeMarkingResult(practice_id, data) {
  try {
    const response = await fetch(`/api/mark/practiceMarkingResult?practice_id=${practice_id}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch submitPracticeMarkingResult api: ' + await response.text());
    }
    if (response.ok) {
      return await response;
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function updateExamSessionStatus(session_id, status = "08") {
  try {
    const response = await fetch(`/api/mark/examSession?session_id=${session_id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch updateExamSessionStatus api: ' + await response.text())
    }
    if (response.ok) {
      return await response;
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}