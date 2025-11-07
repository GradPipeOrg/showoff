// Mock Talent Pool Data for B2B Recruiter Cockpit
// This simulates the pool of candidates who have opted into B2B discovery

export const mockTalentPool = [
  {
    id: '1',
    name: 'Alex Chen',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen',
    bio: 'Full-stack engineer with 5+ years building scalable systems at scale',
    showoffScore: 92,
    githubScore: 88,
    resumeScore: 95,
    b2b_opt_in: true,
    topSkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Kubernetes'],
    links: {
      github: 'https://github.com/alexchen',
      leetcode: 'https://leetcode.com/alexchen'
    },
    experience: [
      { role: 'Senior Software Engineer', company: 'Google', duration: '2021 - Present' },
      { role: 'Software Engineer', company: 'Microsoft', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Computer Science', school: 'Stanford University', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'Distributed Task Queue', description: 'Built a high-performance task queue system handling 10M+ jobs/day' },
      { name: 'Real-time Analytics Platform', description: 'Architected a streaming analytics platform using Kafka and Spark' }
    ]
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahJohnson',
    bio: 'ML engineer specializing in production NLP systems and model deployment',
    showoffScore: 89,
    githubScore: 85,
    resumeScore: 92,
    b2b_opt_in: true,
    topSkills: ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'Kubernetes', 'GCP'],
    links: {
      github: 'https://github.com/sarahj',
      leetcode: 'https://leetcode.com/sarahj'
    },
    experience: [
      { role: 'ML Engineer', company: 'OpenAI', duration: '2022 - Present' },
      { role: 'Data Scientist', company: 'Netflix', duration: '2020 - 2022' }
    ],
    education: [
      { degree: 'MS Machine Learning', school: 'MIT', duration: '2018 - 2020' },
      { degree: 'BS Computer Science', school: 'UC Berkeley', duration: '2014 - 2018' }
    ],
    projects: [
      { name: 'LLM Inference Optimizer', description: 'Reduced inference latency by 60% through optimized model serving' },
      { name: 'Recommendation System', description: 'Built personalized recommendation engine with 40% improvement in CTR' }
    ]
  },
  {
    id: '3',
    name: 'Michael Rodriguez',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MichaelRodriguez',
    bio: 'Systems engineer focused on infrastructure and distributed systems',
    showoffScore: 87,
    githubScore: 90,
    resumeScore: 84,
    b2b_opt_in: true,
    topSkills: ['Go', 'Rust', 'Kubernetes', 'Terraform', 'Prometheus', 'Grafana'],
    links: {
      github: 'https://github.com/mrodriguez',
      leetcode: 'https://leetcode.com/mrodriguez'
    },
    experience: [
      { role: 'Infrastructure Engineer', company: 'Stripe', duration: '2021 - Present' },
      { role: 'DevOps Engineer', company: 'Amazon', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Computer Engineering', school: 'Carnegie Mellon', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'K8s Auto-scaling System', description: 'Built intelligent auto-scaling reducing costs by 45%' },
      { name: 'Observability Platform', description: 'Created unified observability stack for 100+ microservices' }
    ]
  },
  {
    id: '4',
    name: 'Emily Watson',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmilyWatson',
    bio: 'Frontend architect building world-class user experiences',
    showoffScore: 85,
    githubScore: 82,
    resumeScore: 88,
    b2b_opt_in: true,
    topSkills: ['React', 'Next.js', 'TypeScript', 'GraphQL', 'Figma', 'WebGL'],
    links: {
      github: 'https://github.com/emilyw',
      leetcode: 'https://leetcode.com/emilyw'
    },
    experience: [
      { role: 'Senior Frontend Engineer', company: 'Meta', duration: '2020 - Present' },
      { role: 'Frontend Engineer', company: 'Airbnb', duration: '2018 - 2020' }
    ],
    education: [
      { degree: 'BS Web Development', school: 'General Assembly', duration: '2016 - 2018' }
    ],
    projects: [
      { name: 'Design System Library', description: 'Built reusable component library used by 50+ teams' },
      { name: '3D Visualization Tool', description: 'Created interactive 3D data visualization using WebGL' }
    ]
  },
  {
    id: '5',
    name: 'James Kim',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JamesKim',
    bio: 'Backend engineer with expertise in high-throughput APIs',
    showoffScore: 83,
    githubScore: 80,
    resumeScore: 86,
    b2b_opt_in: true,
    topSkills: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Kafka', 'Microservices'],
    links: {
      github: 'https://github.com/jamesk',
      leetcode: 'https://leetcode.com/jamesk'
    },
    experience: [
      { role: 'Backend Engineer', company: 'Uber', duration: '2021 - Present' },
      { role: 'Software Engineer', company: 'Twitter', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Software Engineering', school: 'University of Washington', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'Payment Processing API', description: 'Built payment gateway handling $1B+ in transactions' },
      { name: 'Real-time Messaging System', description: 'Architected messaging system supporting 1M+ concurrent users' }
    ]
  },
  {
    id: '6',
    name: 'Priya Patel',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaPatel',
    bio: 'Security engineer passionate about building secure systems',
    showoffScore: 90,
    githubScore: 87,
    resumeScore: 93,
    b2b_opt_in: true,
    topSkills: ['Python', 'Penetration Testing', 'OWASP', 'Cryptography', 'AWS Security', 'Kubernetes'],
    links: {
      github: 'https://github.com/priyap',
      leetcode: 'https://leetcode.com/priyap'
    },
    experience: [
      { role: 'Security Engineer', company: 'Palantir', duration: '2022 - Present' },
      { role: 'Security Analyst', company: 'CrowdStrike', duration: '2020 - 2022' }
    ],
    education: [
      { degree: 'MS Cybersecurity', school: 'Georgia Tech', duration: '2018 - 2020' },
      { degree: 'BS Computer Science', school: 'UC San Diego', duration: '2014 - 2018' }
    ],
    projects: [
      { name: 'Vulnerability Scanner', description: 'Built automated security scanning tool used across company' },
      { name: 'Zero-Trust Architecture', description: 'Designed and implemented zero-trust network architecture' }
    ]
  },
  {
    id: '7',
    name: 'David Lee',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidLee',
    bio: 'Mobile engineer building native iOS and Android apps',
    showoffScore: 81,
    githubScore: 78,
    resumeScore: 84,
    b2b_opt_in: true,
    topSkills: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'iOS', 'Android'],
    links: {
      github: 'https://github.com/davidl',
      leetcode: 'https://leetcode.com/davidl'
    },
    experience: [
      { role: 'Mobile Engineer', company: 'Snapchat', duration: '2021 - Present' },
      { role: 'iOS Developer', company: 'Spotify', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Computer Science', school: 'UC Los Angeles', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'AR Filter SDK', description: 'Built AR filter SDK used by 100M+ users' },
      { name: 'Music Discovery App', description: 'Created social music discovery app with 500K+ downloads' }
    ]
  },
  {
    id: '8',
    name: 'Lisa Zhang',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LisaZhang',
    bio: 'Data engineer specializing in large-scale data pipelines',
    showoffScore: 88,
    githubScore: 85,
    resumeScore: 91,
    b2b_opt_in: true,
    topSkills: ['Python', 'Apache Spark', 'Airflow', 'Snowflake', 'dbt', 'Kafka'],
    links: {
      github: 'https://github.com/lisaz',
      leetcode: 'https://leetcode.com/lisaz'
    },
    experience: [
      { role: 'Data Engineer', company: 'Databricks', duration: '2022 - Present' },
      { role: 'Analytics Engineer', company: 'Snowflake', duration: '2020 - 2022' }
    ],
    education: [
      { degree: 'MS Data Science', school: 'NYU', duration: '2018 - 2020' },
      { degree: 'BS Statistics', school: 'UC Berkeley', duration: '2014 - 2018' }
    ],
    projects: [
      { name: 'ETL Pipeline Framework', description: 'Built reusable ETL framework processing 100TB+ daily' },
      { name: 'Real-time Analytics Dashboard', description: 'Created real-time analytics dashboard for executive team' }
    ]
  },
  {
    id: '9',
    name: 'Ryan Thompson',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RyanThompson',
    bio: 'Blockchain engineer building DeFi protocols and smart contracts',
    showoffScore: 86,
    githubScore: 89,
    resumeScore: 83,
    b2b_opt_in: true,
    topSkills: ['Solidity', 'Rust', 'Ethereum', 'Web3', 'Smart Contracts', 'DeFi'],
    links: {
      github: 'https://github.com/ryant',
      leetcode: 'https://leetcode.com/ryant'
    },
    experience: [
      { role: 'Blockchain Engineer', company: 'Coinbase', duration: '2021 - Present' },
      { role: 'Smart Contract Developer', company: 'ConsenSys', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Computer Science', school: 'Princeton', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'DeFi Lending Protocol', description: 'Built lending protocol with $50M+ in TVL' },
      { name: 'NFT Marketplace', description: 'Created NFT marketplace with 10K+ transactions' }
    ]
  },
  {
    id: '10',
    name: 'Maria Garcia',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MariaGarcia',
    bio: 'Cloud architect designing scalable cloud infrastructure',
    showoffScore: 84,
    githubScore: 81,
    resumeScore: 87,
    b2b_opt_in: true,
    topSkills: ['AWS', 'Terraform', 'Kubernetes', 'Docker', 'CI/CD', 'Python'],
    links: {
      github: 'https://github.com/mariag',
      leetcode: 'https://leetcode.com/mariag'
    },
    experience: [
      { role: 'Cloud Architect', company: 'Salesforce', duration: '2020 - Present' },
      { role: 'DevOps Engineer', company: 'GitHub', duration: '2018 - 2020' }
    ],
    education: [
      { degree: 'BS Cloud Computing', school: 'Arizona State', duration: '2014 - 2018' }
    ],
    projects: [
      { name: 'Multi-Cloud Migration', description: 'Led migration of 200+ services to multi-cloud architecture' },
      { name: 'Infrastructure as Code', description: 'Automated infrastructure provisioning reducing setup time by 80%' }
    ]
  },
  {
    id: '11',
    name: 'Kevin Park',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KevinPark',
    bio: 'Full-stack engineer with expertise in modern web technologies',
    showoffScore: 82,
    githubScore: 79,
    resumeScore: 85,
    b2b_opt_in: true,
    topSkills: ['React', 'Node.js', 'PostgreSQL', 'GraphQL', 'TypeScript', 'Docker'],
    links: {
      github: 'https://github.com/kevinp',
      leetcode: 'https://leetcode.com/kevinp'
    },
    experience: [
      { role: 'Full-Stack Engineer', company: 'Shopify', duration: '2021 - Present' },
      { role: 'Web Developer', company: 'Etsy', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Computer Science', school: 'University of Toronto', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'E-commerce Platform', description: 'Built scalable e-commerce platform handling 1M+ products' },
      { name: 'Payment Integration System', description: 'Integrated multiple payment gateways reducing checkout time by 40%' }
    ]
  },
  {
    id: '12',
    name: 'Sophie Anderson',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SophieAnderson',
    bio: 'AI researcher working on cutting-edge ML models',
    showoffScore: 91,
    githubScore: 88,
    resumeScore: 94,
    b2b_opt_in: true,
    topSkills: ['Python', 'PyTorch', 'TensorFlow', 'Research', 'NLP', 'Computer Vision'],
    links: {
      github: 'https://github.com/sophiea',
      leetcode: 'https://leetcode.com/sophiea'
    },
    experience: [
      { role: 'AI Researcher', company: 'DeepMind', duration: '2022 - Present' },
      { role: 'ML Engineer', company: 'Facebook AI Research', duration: '2020 - 2022' }
    ],
    education: [
      { degree: 'PhD Machine Learning', school: 'Stanford', duration: '2016 - 2020' },
      { degree: 'MS Computer Science', school: 'MIT', duration: '2014 - 2016' }
    ],
    projects: [
      { name: 'Transformer Architecture', description: 'Published research on efficient transformer architectures' },
      { name: 'Multimodal AI System', description: 'Built AI system combining vision and language understanding' }
    ]
  },
  {
    id: '13',
    name: 'Chris Martinez',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChrisMartinez',
    bio: 'Game developer creating immersive gaming experiences',
    showoffScore: 79,
    githubScore: 76,
    resumeScore: 82,
    b2b_opt_in: true,
    topSkills: ['C++', 'Unity', 'Unreal Engine', 'Game Design', '3D Graphics', 'Shader Programming'],
    links: {
      github: 'https://github.com/chrism',
      leetcode: 'https://leetcode.com/chrism'
    },
    experience: [
      { role: 'Game Developer', company: 'Epic Games', duration: '2021 - Present' },
      { role: 'Junior Developer', company: 'Riot Games', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Game Development', school: 'DigiPen', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'AAA Game Title', description: 'Contributed to AAA game title with 5M+ players' },
      { name: 'Game Engine Optimization', description: 'Optimized rendering pipeline improving FPS by 30%' }
    ]
  },
  {
    id: '14',
    name: 'Amanda White',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmandaWhite',
    bio: 'QA engineer ensuring quality and reliability at scale',
    showoffScore: 77,
    githubScore: 74,
    resumeScore: 80,
    b2b_opt_in: true,
    topSkills: ['Selenium', 'Cypress', 'Test Automation', 'Python', 'CI/CD', 'Quality Assurance'],
    links: {
      github: 'https://github.com/amandaw',
      leetcode: 'https://leetcode.com/amandaw'
    },
    experience: [
      { role: 'QA Engineer', company: 'Adobe', duration: '2020 - Present' },
      { role: 'Test Engineer', company: 'Oracle', duration: '2018 - 2020' }
    ],
    education: [
      { degree: 'BS Software Engineering', school: 'UT Austin', duration: '2014 - 2018' }
    ],
    projects: [
      { name: 'Automated Testing Framework', description: 'Built comprehensive test framework reducing bugs by 50%' },
      { name: 'Performance Testing Suite', description: 'Created load testing suite for 10M+ user scenarios' }
    ]
  },
  {
    id: '15',
    name: 'Daniel Brown',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DanielBrown',
    bio: 'Backend engineer specializing in distributed systems',
    showoffScore: 86,
    githubScore: 83,
    resumeScore: 89,
    b2b_opt_in: true,
    topSkills: ['Java', 'Scala', 'Kafka', 'Cassandra', 'Microservices', 'Distributed Systems'],
    links: {
      github: 'https://github.com/danielb',
      leetcode: 'https://leetcode.com/danielb'
    },
    experience: [
      { role: 'Backend Engineer', company: 'LinkedIn', duration: '2021 - Present' },
      { role: 'Software Engineer', company: 'Yahoo', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Computer Science', school: 'University of Illinois', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'Distributed Cache System', description: 'Built distributed cache handling 100M+ requests/day' },
      { name: 'Event Streaming Platform', description: 'Architected event streaming platform for real-time data' }
    ]
  },
  {
    id: '16',
    name: 'Jessica Taylor',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JessicaTaylor',
    bio: 'Product engineer building user-focused products',
    showoffScore: 83,
    githubScore: 80,
    resumeScore: 86,
    b2b_opt_in: true,
    topSkills: ['React', 'TypeScript', 'Product Design', 'User Research', 'Analytics', 'A/B Testing'],
    links: {
      github: 'https://github.com/jessicat',
      leetcode: 'https://leetcode.com/jessicat'
    },
    experience: [
      { role: 'Product Engineer', company: 'Figma', duration: '2021 - Present' },
      { role: 'Frontend Engineer', company: 'Notion', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Human-Computer Interaction', school: 'Carnegie Mellon', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'Design Collaboration Tool', description: 'Built tool enabling real-time design collaboration' },
      { name: 'User Analytics Dashboard', description: 'Created analytics dashboard driving product decisions' }
    ]
  },
  {
    id: '17',
    name: 'Robert Wilson',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RobertWilson',
    bio: 'Database engineer optimizing data systems for performance',
    showoffScore: 85,
    githubScore: 82,
    resumeScore: 88,
    b2b_opt_in: true,
    topSkills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Database Optimization', 'SQL'],
    links: {
      github: 'https://github.com/robertw',
      leetcode: 'https://leetcode.com/robertw'
    },
    experience: [
      { role: 'Database Engineer', company: 'MongoDB', duration: '2020 - Present' },
      { role: 'DBA', company: 'Oracle', duration: '2018 - 2020' }
    ],
    education: [
      { degree: 'BS Database Systems', school: 'University of Maryland', duration: '2014 - 2018' }
    ],
    projects: [
      { name: 'Query Optimization Engine', description: 'Built query optimizer improving performance by 70%' },
      { name: 'Database Migration Tool', description: 'Created tool for seamless database migrations' }
    ]
  },
  {
    id: '18',
    name: 'Jennifer Liu',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JenniferLiu',
    bio: 'DevOps engineer automating infrastructure and deployments',
    showoffScore: 84,
    githubScore: 81,
    resumeScore: 87,
    b2b_opt_in: true,
    topSkills: ['Kubernetes', 'Docker', 'Jenkins', 'GitLab CI', 'Terraform', 'Ansible'],
    links: {
      github: 'https://github.com/jenniferl',
      leetcode: 'https://leetcode.com/jenniferl'
    },
    experience: [
      { role: 'DevOps Engineer', company: 'GitLab', duration: '2021 - Present' },
      { role: 'Site Reliability Engineer', company: 'Google', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Systems Engineering', school: 'Virginia Tech', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'CI/CD Pipeline Automation', description: 'Automated CI/CD reducing deployment time by 60%' },
      { name: 'Infrastructure Monitoring', description: 'Built comprehensive monitoring system for 500+ services' }
    ]
  },
  {
    id: '19',
    name: 'Thomas Anderson',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThomasAnderson',
    bio: 'Full-stack engineer with passion for clean code and architecture',
    showoffScore: 80,
    githubScore: 77,
    resumeScore: 83,
    b2b_opt_in: true,
    topSkills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'GraphQL', 'TypeScript'],
    links: {
      github: 'https://github.com/thomasa',
      leetcode: 'https://leetcode.com/thomasa'
    },
    experience: [
      { role: 'Full-Stack Engineer', company: 'Slack', duration: '2021 - Present' },
      { role: 'Software Engineer', company: 'Dropbox', duration: '2019 - 2021' }
    ],
    education: [
      { degree: 'BS Computer Science', school: 'UC Santa Barbara', duration: '2015 - 2019' }
    ],
    projects: [
      { name: 'Real-time Collaboration App', description: 'Built real-time collaboration features for 10M+ users' },
      { name: 'API Gateway', description: 'Created unified API gateway for microservices architecture' }
    ]
  },
  {
    id: '20',
    name: 'Nicole Davis',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NicoleDavis',
    bio: 'Platform engineer building developer tools and infrastructure',
    showoffScore: 88,
    githubScore: 85,
    resumeScore: 91,
    b2b_opt_in: true,
    topSkills: ['Go', 'Kubernetes', 'gRPC', 'Protocol Buffers', 'Observability', 'Developer Experience'],
    links: {
      github: 'https://github.com/nicoled',
      leetcode: 'https://leetcode.com/nicoled'
    },
    experience: [
      { role: 'Platform Engineer', company: 'Hashicorp', duration: '2022 - Present' },
      { role: 'Infrastructure Engineer', company: 'PagerDuty', duration: '2020 - 2022' }
    ],
    education: [
      { degree: 'MS Computer Science', school: 'UC San Diego', duration: '2018 - 2020' },
      { degree: 'BS Computer Science', school: 'UC Irvine', duration: '2014 - 2018' }
    ],
    projects: [
      { name: 'Developer Platform SDK', description: 'Built SDK used by 1000+ developers internally' },
      { name: 'Service Mesh Implementation', description: 'Implemented service mesh improving reliability by 40%' }
    ]
  }
]

