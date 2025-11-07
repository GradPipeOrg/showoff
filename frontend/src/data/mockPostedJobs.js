// Mock Posted Jobs Data for Recruiter Cockpit
// This simulates jobs that recruiters have posted

export const mockPostedJobs = [
  {
    id: 'job-1',
    title: 'Senior React Developer',
    status: 'Actively Matching',
    location: 'Remote',
    salaryRange: '25-35 LPA',
    matchesFound: 15,
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    description: 'We are looking for an experienced React developer to join our frontend team. You will work on building scalable web applications using modern React patterns.',
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'job-2',
    title: 'Full-Stack Engineer (Python/Django)',
    status: 'Actively Matching',
    location: 'Mumbai, Hybrid',
    salaryRange: '20-30 LPA',
    matchesFound: 12,
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'REST APIs'],
    description: 'Join our backend team to build robust APIs and microservices. Experience with Django, PostgreSQL, and containerization required.',
    createdAt: '2025-01-10T14:30:00Z'
  },
  {
    id: 'job-3',
    title: 'ML Engineer (Computer Vision)',
    status: 'Actively Matching',
    location: 'Bangalore',
    salaryRange: '30-45 LPA',
    matchesFound: 8,
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Computer Vision', 'OpenCV'],
    description: 'We need a talented ML engineer specializing in computer vision to work on cutting-edge image recognition and processing systems.',
    createdAt: '2025-01-05T09:15:00Z'
  },
  {
    id: 'job-4',
    title: 'DevOps Engineer (Kubernetes)',
    status: 'Actively Matching',
    location: 'Remote',
    salaryRange: '22-32 LPA',
    matchesFound: 10,
    skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD', 'Prometheus'],
    description: 'Looking for a DevOps engineer to manage our cloud infrastructure and CI/CD pipelines. Strong Kubernetes experience required.',
    createdAt: '2025-01-12T11:20:00Z'
  }
]

