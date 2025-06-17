import axios from "axios"

// Force http://localhost:5062/api as the API URL
// const API_BASE_URL = "http://localhost:5062/api"
const API_BASE_URL = "https://edusync-backend1-dtczecggf2fedqhr.centralindia-01.azurewebsites.net/api"

// Create axios instance for authentication
export const authAPI = axios.create({
  baseURL: `${API_BASE_URL}`,
  timeout: Number.parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Create axios instance for general API calls
export const api = axios.create({
  baseURL: `${API_BASE_URL}`,
  timeout: Number.parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Debug log for requests
    console.log("API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data
    });
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// API service functions
export const courseService = {
  getAllCourses: () => api.get("/courses"),
  getCourseById: (id) => api.get(`/courses/${id}`),
  createCourse: (courseData) => api.post("/courses", courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  enrollInCourse: (courseId) => {
    console.log("Enrolling in course with ID:", courseId);
    return api.post(`/courses/${courseId}/enroll`);
  },
  getInstructorCourses: () => api.get("/courses/instructor"),
  getStudentCourses: () => api.get("/courses/student"),
  getEnrollmentCount: (courseId) => api.get(`/courses/${courseId}/enrollments`),
}

export const courseMaterialService = {
  getMaterials: (courseId) => {
    console.log("API Call - getMaterials with ID:", courseId);
    
    if (!courseId) {
      console.error("getMaterials called with invalid courseId:", courseId);
      return Promise.reject(new Error("Invalid course ID"));
    }
    
    // Ensure the courseId is properly encoded for URL
    const encodedId = encodeURIComponent(courseId);
    const requestUrl = `/courses/${encodedId}/materials`;
    
    console.log("Making GET request to:", `${API_BASE_URL}${requestUrl}`);
    
    return api.get(requestUrl)
      .then(response => {
        console.log("Materials API response:", response);
        return response;
      })
      .catch(error => {
        console.error("Materials API error:", error);
        throw error;
      });
  },
  addMaterial: (courseId, material) => {
    const encodedId = encodeURIComponent(courseId);
    return api.post(`/courses/${encodedId}/materials`, material);
  },
  deleteMaterial: (courseId, materialId) => {
    const encodedId = encodeURIComponent(courseId);
    const encodedMaterialId = encodeURIComponent(materialId);
    return api.delete(`/courses/${encodedId}/materials/${encodedMaterialId}`);
  },
}

export const assessmentService = {
  getAssessmentsByCourse: (courseId) => api.get(`/assessments/course/${courseId}`),
  getAssessmentById: (id) => api.get(`/assessments/${id}`),
  getAllAssessments: () => api.get('/assessments'),
  createAssessment: (assessmentData) => api.post("/assessments", assessmentData),
  updateAssessment: (id, assessmentData) => api.put(`/assessments/${id}`, assessmentData),
  deleteAssessment: (id) => api.delete(`/assessments/${id}`),
  submitAssessment: (assessmentId, submissionData) => {
    console.log("Submitting assessment:", assessmentId);
    console.log("Submission data:", submissionData);
    
    // Ensure we have the correct format for the backend
    const payload = {
      assessmentId: submissionData.assessmentId,
      userId: submissionData.userId,
      submittedAnswers: submissionData.submittedAnswers
    };
    
    console.log("Full submission payload:", payload);
    
    return api.post(`/assessments/${assessmentId}/submit`, payload)
      .then(response => {
        console.log("Assessment submission response from server:", response.data);
        return response;
      });
  },
  getStudentResults: (assessmentId) => api.get(`/assessments/${assessmentId}/results`),
}

export const userService = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (userData) => api.put("/users/profile", userData),
  getStudentProgress: () => api.get("/users/progress"),
  getInstructorStats: () => api.get("/users/instructor-stats"),
}

export const fileService = {
  uploadFile: (file, type = "course") => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    return api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        // You can use this to track upload progress if needed
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log(`Upload progress: ${percentCompleted}%`)
      }
    })
  },
  getCourseFiles: (courseId) => api.get(`/files/course/${courseId}`),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  
  downloadFile: (fileUrl, fileName) => {
    // Create a URL with query parameters
    const downloadUrl = `${API_BASE_URL}/files/download?fileUrl=${encodeURIComponent(fileUrl)}${fileName ? `&fileName=${encodeURIComponent(fileName)}` : ''}`;
    
    // Get the auth token
    const token = localStorage.getItem("token");
    
    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Add authorization header via a fetch request for authenticated downloads
    if (token) {
      // For direct download with authentication, we need to use fetch
      fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Set up the download link
        link.href = url;
        link.download = fileName || fileService.getFileNameFromUrl(fileUrl);
        
        // Append to body, click and remove
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error("Error downloading file:", error);
        throw error;
      });
    } else {
      // Fallback for public files (no auth)
      link.download = fileName || fileService.getFileNameFromUrl(fileUrl);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
  
  // Helper functions for working with Azure blob URLs
  getFileNameFromUrl: (url) => {
    if (!url) return ''
    try {
      // For Azure Blob Storage URLs
      if (url.includes('blob.core.windows.net')) {
        const uri = new URL(url)
        const pathSegments = uri.pathname.split('/')
        return decodeURIComponent(pathSegments[pathSegments.length - 1])
      }
      
      // For other URLs
      const pathSegments = url.split('/')
      return pathSegments[pathSegments.length - 1]
    } catch (error) {
      console.error('Error parsing URL:', error)
      return ''
    }
  },
  
  getFileExtension: (url) => {
    const fileName = fileService.getFileNameFromUrl(url)
    if (!fileName) return ''
    
    const parts = fileName.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
  },
  
  isPreviewableFile: (url) => {
    const extension = fileService.getFileExtension(url)
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(extension)
  },
  
  getFileIcon: (url) => {
    const extension = fileService.getFileExtension(url)
    
    // Map extensions to icons (you can expand this based on your needs)
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'ppt':
      case 'pptx':
        return '📺'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      case 'mp4':
      case 'mov':
      case 'avi':
        return '🎬'
      case 'mp3':
      case 'wav':
        return '🎵'
      default:
        return '📁'
    }
  }
}