const path = require('path');
const fs = require('fs');

const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
    break;
  }
}
require('dotenv').config();

const neo4j = require('neo4j-driver');

const URI = process.env.COGNODB_URI;
const USERNAME = process.env.COGNODB_USERNAME || 'cognodb';
const PASSWORD = process.env.COGNODB_PASSWORD;

if (!URI || !PASSWORD || URI.includes('db-xxxxxxxx')) {
  console.error('❌  Missing or invalid COGNODB_URI / COGNODB_PASSWORD in .env file.');
  process.exit(1);
}

const driver = neo4j.driver(URI, neo4j.auth.basic(USERNAME, PASSWORD));

// ─── Seed Data Definitions ───────────────────────────────────────────────────

const skills = [
  { id: 'skill-python', name: 'Python', category: 'Programming', difficulty: 'Beginner' },
  { id: 'skill-javascript', name: 'JavaScript', category: 'Programming', difficulty: 'Beginner' },
  { id: 'skill-typescript', name: 'TypeScript', category: 'Programming', difficulty: 'Intermediate' },
  { id: 'skill-java', name: 'Java', category: 'Programming', difficulty: 'Intermediate' },
  { id: 'skill-cpp', name: 'C++', category: 'Programming', difficulty: 'Advanced' },
  { id: 'skill-go', name: 'Go', category: 'Programming', difficulty: 'Intermediate' },
  { id: 'skill-html', name: 'HTML/CSS', category: 'Frontend', difficulty: 'Beginner' },
  { id: 'skill-react', name: 'React', category: 'Frontend', difficulty: 'Intermediate' },
  { id: 'skill-vue', name: 'Vue.js', category: 'Frontend', difficulty: 'Intermediate' },
  { id: 'skill-nextjs', name: 'Next.js', category: 'Frontend', difficulty: 'Intermediate' },
  { id: 'skill-nodejs', name: 'Node.js', category: 'Backend', difficulty: 'Intermediate' },
  { id: 'skill-express', name: 'Express.js', category: 'Backend', difficulty: 'Intermediate' },
  { id: 'skill-fastapi', name: 'FastAPI', category: 'Backend', difficulty: 'Intermediate' },
  { id: 'skill-django', name: 'Django', category: 'Backend', difficulty: 'Intermediate' },
  { id: 'skill-restapi', name: 'REST API Design', category: 'Backend', difficulty: 'Intermediate' },
  { id: 'skill-sql', name: 'SQL', category: 'Database', difficulty: 'Beginner' },
  { id: 'skill-mongodb', name: 'MongoDB', category: 'Database', difficulty: 'Intermediate' },
  { id: 'skill-postgres', name: 'PostgreSQL', category: 'Database', difficulty: 'Intermediate' },
  { id: 'skill-redis', name: 'Redis', category: 'Database', difficulty: 'Intermediate' },
  { id: 'skill-numpy', name: 'NumPy', category: 'Data Science', difficulty: 'Beginner' },
  { id: 'skill-pandas', name: 'Pandas', category: 'Data Science', difficulty: 'Beginner' },
  { id: 'skill-matplotlib', name: 'Matplotlib', category: 'Data Science', difficulty: 'Beginner' },
  { id: 'skill-sklearn', name: 'Scikit-learn', category: 'Machine Learning', difficulty: 'Intermediate' },
  { id: 'skill-ml', name: 'Machine Learning', category: 'Machine Learning', difficulty: 'Intermediate' },
  { id: 'skill-dl', name: 'Deep Learning', category: 'Machine Learning', difficulty: 'Advanced' },
  { id: 'skill-pytorch', name: 'PyTorch', category: 'Machine Learning', difficulty: 'Advanced' },
  { id: 'skill-tensorflow', name: 'TensorFlow', category: 'Machine Learning', difficulty: 'Advanced' },
  { id: 'skill-nlp', name: 'NLP', category: 'Machine Learning', difficulty: 'Advanced' },
  { id: 'skill-cv', name: 'Computer Vision', category: 'Machine Learning', difficulty: 'Advanced' },
  { id: 'skill-aws', name: 'AWS', category: 'Cloud', difficulty: 'Intermediate' },
  { id: 'skill-gcp', name: 'Google Cloud', category: 'Cloud', difficulty: 'Intermediate' },
  { id: 'skill-docker', name: 'Docker', category: 'DevOps', difficulty: 'Intermediate' },
  { id: 'skill-kubernetes', name: 'Kubernetes', category: 'DevOps', difficulty: 'Advanced' },
  { id: 'skill-cicd', name: 'CI/CD', category: 'DevOps', difficulty: 'Intermediate' },
  { id: 'skill-git', name: 'Git', category: 'DevOps', difficulty: 'Beginner' },
  { id: 'skill-spark', name: 'Apache Spark', category: 'Data Engineering', difficulty: 'Advanced' },
  { id: 'skill-kafka', name: 'Apache Kafka', category: 'Data Engineering', difficulty: 'Advanced' },
  { id: 'skill-airflow', name: 'Apache Airflow', category: 'Data Engineering', difficulty: 'Intermediate' },
  { id: 'skill-jest', name: 'Jest', category: 'Testing', difficulty: 'Intermediate' },
  { id: 'skill-pytest', name: 'PyTest', category: 'Testing', difficulty: 'Intermediate' },
  { id: 'skill-sysdesign', name: 'System Design', category: 'Architecture', difficulty: 'Advanced' },
  { id: 'skill-graphql', name: 'GraphQL', category: 'Backend', difficulty: 'Intermediate' },
  { id: 'skill-tableau', name: 'Tableau', category: 'Analytics', difficulty: 'Intermediate' },
  { id: 'skill-powerbi', name: 'Power BI', category: 'Analytics', difficulty: 'Beginner' },
  { id: 'skill-stats', name: 'Statistics', category: 'Data Science', difficulty: 'Intermediate' },
  { id: 'skill-reactnative', name: 'React Native', category: 'Mobile', difficulty: 'Intermediate' },
  { id: 'skill-security', name: 'Cybersecurity Basics', category: 'Security', difficulty: 'Intermediate' },
  { id: 'skill-agile', name: 'Agile / Scrum', category: 'Soft Skills', difficulty: 'Beginner' },
  { id: 'skill-llm', name: 'LLM Fine-tuning', category: 'AI', difficulty: 'Advanced' },
  { id: 'skill-prompteng', name: 'Prompt Engineering', category: 'AI', difficulty: 'Intermediate' },
];

const prerequisites = [
  ['skill-python', 'skill-numpy'],
  ['skill-python', 'skill-pandas'],
  ['skill-python', 'skill-fastapi'],
  ['skill-python', 'skill-django'],
  ['skill-python', 'skill-pytest'],
  ['skill-numpy', 'skill-pandas'],
  ['skill-pandas', 'skill-matplotlib'],
  ['skill-pandas', 'skill-sklearn'],
  ['skill-matplotlib', 'skill-sklearn'],
  ['skill-sklearn', 'skill-ml'],
  ['skill-ml', 'skill-dl'],
  ['skill-dl', 'skill-pytorch'],
  ['skill-dl', 'skill-tensorflow'],
  ['skill-pytorch', 'skill-cv'],
  ['skill-pytorch', 'skill-llm'],
  ['skill-dl', 'skill-nlp'],
  ['skill-nlp', 'skill-llm'],
  ['skill-sql', 'skill-postgres'],
  ['skill-sql', 'skill-airflow'],
  ['skill-python', 'skill-spark'],
  ['skill-spark', 'skill-kafka'],
  ['skill-html', 'skill-react'],
  ['skill-html', 'skill-vue'],
  ['skill-javascript', 'skill-react'],
  ['skill-javascript', 'skill-typescript'],
  ['skill-javascript', 'skill-nodejs'],
  ['skill-typescript', 'skill-nextjs'],
  ['skill-react', 'skill-nextjs'],
  ['skill-react', 'skill-reactnative'],
  ['skill-nodejs', 'skill-express'],
  ['skill-git', 'skill-cicd'],
  ['skill-docker', 'skill-kubernetes'],
  ['skill-docker', 'skill-cicd'],
  ['skill-stats', 'skill-ml'],
  ['skill-ml', 'skill-prompteng'],
  ['skill-prompteng', 'skill-llm'],
  ['skill-restapi', 'skill-graphql'],
];

const technologies = [
  { id: 'tech-python', name: 'Python', category: 'Language' },
  { id: 'tech-javascript', name: 'JavaScript', category: 'Language' },
  { id: 'tech-react', name: 'React', category: 'Framework' },
  { id: 'tech-nodejs', name: 'Node.js', category: 'Runtime' },
  { id: 'tech-flask', name: 'Flask', category: 'Framework' },
  { id: 'tech-fastapi', name: 'FastAPI', category: 'Framework' },
  { id: 'tech-pytorch', name: 'PyTorch', category: 'Library' },
  { id: 'tech-tensorflow', name: 'TensorFlow', category: 'Library' },
  { id: 'tech-docker', name: 'Docker', category: 'DevOps' },
  { id: 'tech-mongodb', name: 'MongoDB', category: 'Database' },
  { id: 'tech-postgres', name: 'PostgreSQL', category: 'Database' },
  { id: 'tech-redis', name: 'Redis', category: 'Cache' },
  { id: 'tech-aws', name: 'AWS', category: 'Cloud' },
  { id: 'tech-gcp', name: 'Google Cloud', category: 'Cloud' },
  { id: 'tech-nextjs', name: 'Next.js', category: 'Framework' },
  { id: 'tech-tailwind', name: 'Tailwind CSS', category: 'Framework' },
  { id: 'tech-graphql', name: 'GraphQL', category: 'API' },
  { id: 'tech-kafka', name: 'Apache Kafka', category: 'Messaging' },
  { id: 'tech-spark', name: 'Apache Spark', category: 'Data' },
  { id: 'tech-kubernetes', name: 'Kubernetes', category: 'DevOps' },
];

const companies = [
  { id: 'co-google', name: 'Google', industry: 'Technology' },
  { id: 'co-meta', name: 'Meta', industry: 'Social Media' },
  { id: 'co-amazon', name: 'Amazon', industry: 'E-Commerce / Cloud' },
  { id: 'co-microsoft', name: 'Microsoft', industry: 'Technology' },
  { id: 'co-netflix', name: 'Netflix', industry: 'Entertainment' },
  { id: 'co-uber', name: 'Uber', industry: 'Transportation' },
  { id: 'co-stripe', name: 'Stripe', industry: 'Fintech' },
  { id: 'co-openai', name: 'OpenAI', industry: 'AI Research' },
  { id: 'co-airbnb', name: 'Airbnb', industry: 'Travel' },
  { id: 'co-spotify', name: 'Spotify', industry: 'Music / Tech' },
];

const careerRoles = [
  { id: 'cr-frontend', title: 'Frontend Developer', description: 'Builds user interfaces and web experiences using modern frameworks.' },
  { id: 'cr-backend', title: 'Backend Developer', description: 'Designs and implements server-side logic, APIs, and databases.' },
  { id: 'cr-fullstack', title: 'Full Stack Developer', description: 'Works across frontend and backend, end-to-end feature delivery.' },
  { id: 'cr-mleng', title: 'ML Engineer', description: 'Builds, trains, and deploys machine learning models at scale.' },
  { id: 'cr-datascientist', title: 'Data Scientist', description: 'Analyzes data to extract insights and build predictive models.' },
  { id: 'cr-dataanalyst', title: 'Data Analyst', description: 'Transforms raw data into actionable reports and dashboards.' },
  { id: 'cr-dataeng', title: 'Data Engineer', description: 'Builds data pipelines and infrastructure for analytics.' },
  { id: 'cr-devops', title: 'DevOps Engineer', description: 'Manages CI/CD, infrastructure, and deployment automation.' },
  { id: 'cr-cloud', title: 'Cloud Architect', description: 'Designs scalable cloud infrastructure and services.' },
  { id: 'cr-airesearcher', title: 'AI Researcher', description: 'Conducts research in deep learning, NLP, and AI systems.' },
  { id: 'cr-mobile', title: 'Mobile Developer', description: 'Builds cross-platform or native mobile applications.' },
  { id: 'cr-sre', title: 'Site Reliability Engineer', description: 'Ensures reliability, scalability, and performance of production systems.' },
  { id: 'cr-security', title: 'Security Engineer', description: 'Protects systems and data from vulnerabilities and attacks.' },
  { id: 'cr-llmeng', title: 'LLM/AI Engineer', description: 'Builds products on top of large language models and AI APIs.' },
  { id: 'cr-sysdesign', title: 'Solutions Architect', description: 'Designs distributed systems and guides technical strategy.' },
];

const careerSkills = [
  ['cr-frontend', 'skill-html', 'critical'],
  ['cr-frontend', 'skill-javascript', 'critical'],
  ['cr-frontend', 'skill-react', 'critical'],
  ['cr-frontend', 'skill-typescript', 'high'],
  ['cr-frontend', 'skill-nextjs', 'medium'],
  ['cr-frontend', 'skill-git', 'high'],
  ['cr-backend', 'skill-nodejs', 'critical'],
  ['cr-backend', 'skill-python', 'high'],
  ['cr-backend', 'skill-sql', 'critical'],
  ['cr-backend', 'skill-restapi', 'critical'],
  ['cr-backend', 'skill-docker', 'high'],
  ['cr-backend', 'skill-mongodb', 'medium'],
  ['cr-backend', 'skill-git', 'high'],
  ['cr-fullstack', 'skill-javascript', 'critical'],
  ['cr-fullstack', 'skill-react', 'critical'],
  ['cr-fullstack', 'skill-nodejs', 'critical'],
  ['cr-fullstack', 'skill-sql', 'high'],
  ['cr-fullstack', 'skill-git', 'high'],
  ['cr-fullstack', 'skill-docker', 'medium'],
  ['cr-fullstack', 'skill-typescript', 'medium'],
  ['cr-mleng', 'skill-python', 'critical'],
  ['cr-mleng', 'skill-ml', 'critical'],
  ['cr-mleng', 'skill-dl', 'critical'],
  ['cr-mleng', 'skill-pytorch', 'critical'],
  ['cr-mleng', 'skill-numpy', 'high'],
  ['cr-mleng', 'skill-pandas', 'high'],
  ['cr-mleng', 'skill-sklearn', 'high'],
  ['cr-mleng', 'skill-docker', 'medium'],
  ['cr-mleng', 'skill-sql', 'medium'],
  ['cr-datascientist', 'skill-python', 'critical'],
  ['cr-datascientist', 'skill-stats', 'critical'],
  ['cr-datascientist', 'skill-pandas', 'critical'],
  ['cr-datascientist', 'skill-ml', 'critical'],
  ['cr-datascientist', 'skill-sklearn', 'high'],
  ['cr-datascientist', 'skill-matplotlib', 'high'],
  ['cr-datascientist', 'skill-sql', 'high'],
  ['cr-datascientist', 'skill-numpy', 'high'],
  ['cr-dataanalyst', 'skill-sql', 'critical'],
  ['cr-dataanalyst', 'skill-python', 'high'],
  ['cr-dataanalyst', 'skill-pandas', 'high'],
  ['cr-dataanalyst', 'skill-tableau', 'high'],
  ['cr-dataanalyst', 'skill-powerbi', 'medium'],
  ['cr-dataanalyst', 'skill-stats', 'high'],
  ['cr-dataeng', 'skill-python', 'critical'],
  ['cr-dataeng', 'skill-sql', 'critical'],
  ['cr-dataeng', 'skill-spark', 'critical'],
  ['cr-dataeng', 'skill-kafka', 'high'],
  ['cr-dataeng', 'skill-airflow', 'high'],
  ['cr-dataeng', 'skill-docker', 'medium'],
  ['cr-dataeng', 'skill-postgres', 'medium'],
  ['cr-devops', 'skill-docker', 'critical'],
  ['cr-devops', 'skill-kubernetes', 'critical'],
  ['cr-devops', 'skill-cicd', 'critical'],
  ['cr-devops', 'skill-git', 'high'],
  ['cr-devops', 'skill-aws', 'high'],
  ['cr-devops', 'skill-python', 'medium'],
  ['cr-cloud', 'skill-aws', 'critical'],
  ['cr-cloud', 'skill-gcp', 'high'],
  ['cr-cloud', 'skill-kubernetes', 'high'],
  ['cr-cloud', 'skill-docker', 'high'],
  ['cr-cloud', 'skill-sysdesign', 'critical'],
  ['cr-cloud', 'skill-security', 'high'],
  ['cr-airesearcher', 'skill-python', 'critical'],
  ['cr-airesearcher', 'skill-pytorch', 'critical'],
  ['cr-airesearcher', 'skill-tensorflow', 'high'],
  ['cr-airesearcher', 'skill-dl', 'critical'],
  ['cr-airesearcher', 'skill-nlp', 'high'],
  ['cr-airesearcher', 'skill-cv', 'high'],
  ['cr-airesearcher', 'skill-stats', 'high'],
  ['cr-mobile', 'skill-reactnative', 'critical'],
  ['cr-mobile', 'skill-javascript', 'critical'],
  ['cr-mobile', 'skill-typescript', 'high'],
  ['cr-mobile', 'skill-react', 'high'],
  ['cr-mobile', 'skill-restapi', 'medium'],
  ['cr-sre', 'skill-kubernetes', 'critical'],
  ['cr-sre', 'skill-docker', 'critical'],
  ['cr-sre', 'skill-cicd', 'high'],
  ['cr-sre', 'skill-python', 'high'],
  ['cr-sre', 'skill-sysdesign', 'high'],
  ['cr-security', 'skill-security', 'critical'],
  ['cr-security', 'skill-python', 'high'],
  ['cr-security', 'skill-docker', 'medium'],
  ['cr-security', 'skill-sysdesign', 'medium'],
  ['cr-llmeng', 'skill-python', 'critical'],
  ['cr-llmeng', 'skill-llm', 'critical'],
  ['cr-llmeng', 'skill-prompteng', 'critical'],
  ['cr-llmeng', 'skill-fastapi', 'high'],
  ['cr-llmeng', 'skill-pytorch', 'high'],
  ['cr-llmeng', 'skill-nlp', 'high'],
  ['cr-sysdesign', 'skill-sysdesign', 'critical'],
  ['cr-sysdesign', 'skill-aws', 'high'],
  ['cr-sysdesign', 'skill-restapi', 'high'],
  ['cr-sysdesign', 'skill-graphql', 'medium'],
  ['cr-sysdesign', 'skill-docker', 'high'],
  ['cr-sysdesign', 'skill-sql', 'high'],
];

const careerLeadsTo = [
  ['cr-frontend', 'cr-fullstack'],
  ['cr-backend', 'cr-fullstack'],
  ['cr-fullstack', 'cr-sysdesign'],
  ['cr-mleng', 'cr-airesearcher'],
  ['cr-mleng', 'cr-llmeng'],
  ['cr-dataanalyst', 'cr-datascientist'],
  ['cr-datascientist', 'cr-mleng'],
  ['cr-devops', 'cr-sre'],
  ['cr-devops', 'cr-cloud'],
  ['cr-sre', 'cr-cloud'],
  ['cr-frontend', 'cr-mobile'],
  ['cr-backend', 'cr-dataeng'],
  ['cr-datascientist', 'cr-dataeng'],
];

const jobs = [
  { id: 'job-1', title: 'Frontend Engineer', experienceLevel: 'Mid-Level', location: 'San Francisco, CA', salaryRange: '$120k–$160k', companyId: 'co-google', careerRoleId: 'cr-frontend', skills: ['skill-react', 'skill-typescript', 'skill-nextjs'] },
  { id: 'job-2', title: 'UI Engineer', experienceLevel: 'Senior', location: 'New York, NY', salaryRange: '$150k–$200k', companyId: 'co-meta', careerRoleId: 'cr-frontend', skills: ['skill-react', 'skill-javascript', 'skill-typescript'] },
  { id: 'job-3', title: 'Frontend Developer', experienceLevel: 'Entry-Level', location: 'Remote', salaryRange: '$80k–$110k', companyId: 'co-spotify', careerRoleId: 'cr-frontend', skills: ['skill-html', 'skill-javascript', 'skill-react'] },
  { id: 'job-4', title: 'Backend Engineer', experienceLevel: 'Mid-Level', location: 'Seattle, WA', salaryRange: '$130k–$180k', companyId: 'co-amazon', careerRoleId: 'cr-backend', skills: ['skill-nodejs', 'skill-sql', 'skill-docker'] },
  { id: 'job-5', title: 'API Engineer', experienceLevel: 'Senior', location: 'Remote', salaryRange: '$140k–$190k', companyId: 'co-stripe', careerRoleId: 'cr-backend', skills: ['skill-python', 'skill-restapi', 'skill-postgres'] },
  { id: 'job-6', title: 'Node.js Developer', experienceLevel: 'Entry-Level', location: 'Austin, TX', salaryRange: '$85k–$120k', companyId: 'co-uber', careerRoleId: 'cr-backend', skills: ['skill-nodejs', 'skill-express', 'skill-mongodb'] },
  { id: 'job-7', title: 'Full Stack Engineer', experienceLevel: 'Mid-Level', location: 'San Francisco, CA', salaryRange: '$140k–$180k', companyId: 'co-airbnb', careerRoleId: 'cr-fullstack', skills: ['skill-react', 'skill-nodejs', 'skill-sql'] },
  { id: 'job-8', title: 'Full Stack Developer', experienceLevel: 'Senior', location: 'Remote', salaryRange: '$160k–$220k', companyId: 'co-netflix', careerRoleId: 'cr-fullstack', skills: ['skill-javascript', 'skill-react', 'skill-nodejs', 'skill-docker'] },
  { id: 'job-9', title: 'Machine Learning Engineer', experienceLevel: 'Mid-Level', location: 'Mountain View, CA', salaryRange: '$160k–$220k', companyId: 'co-google', careerRoleId: 'cr-mleng', skills: ['skill-python', 'skill-ml', 'skill-pytorch', 'skill-docker'] },
  { id: 'job-10', title: 'ML Platform Engineer', experienceLevel: 'Senior', location: 'Seattle, WA', salaryRange: '$180k–$260k', companyId: 'co-amazon', careerRoleId: 'cr-mleng', skills: ['skill-python', 'skill-dl', 'skill-pytorch', 'skill-aws'] },
  { id: 'job-11', title: 'Research Engineer', experienceLevel: 'Senior', location: 'San Francisco, CA', salaryRange: '$200k–$300k', companyId: 'co-openai', careerRoleId: 'cr-mleng', skills: ['skill-python', 'skill-pytorch', 'skill-dl', 'skill-nlp'] },
  { id: 'job-12', title: 'Data Scientist', experienceLevel: 'Mid-Level', location: 'New York, NY', salaryRange: '$130k–$170k', companyId: 'co-netflix', careerRoleId: 'cr-datascientist', skills: ['skill-python', 'skill-ml', 'skill-stats', 'skill-sql'] },
  { id: 'job-13', title: 'Senior Data Scientist', experienceLevel: 'Senior', location: 'Menlo Park, CA', salaryRange: '$160k–$210k', companyId: 'co-meta', careerRoleId: 'cr-datascientist', skills: ['skill-python', 'skill-ml', 'skill-sklearn', 'skill-pytorch'] },
  { id: 'job-14', title: 'Data Analyst', experienceLevel: 'Entry-Level', location: 'Remote', salaryRange: '$70k–$100k', companyId: 'co-spotify', careerRoleId: 'cr-dataanalyst', skills: ['skill-sql', 'skill-python', 'skill-tableau'] },
  { id: 'job-15', title: 'Business Intelligence Analyst', experienceLevel: 'Mid-Level', location: 'Chicago, IL', salaryRange: '$100k–$130k', companyId: 'co-uber', careerRoleId: 'cr-dataanalyst', skills: ['skill-sql', 'skill-powerbi', 'skill-stats'] },
  { id: 'job-16', title: 'Data Engineer', experienceLevel: 'Mid-Level', location: 'New York, NY', salaryRange: '$130k–$170k', companyId: 'co-airbnb', careerRoleId: 'cr-dataeng', skills: ['skill-python', 'skill-spark', 'skill-airflow'] },
  { id: 'job-17', title: 'Senior Data Engineer', experienceLevel: 'Senior', location: 'Seattle, WA', salaryRange: '$160k–$210k', companyId: 'co-amazon', careerRoleId: 'cr-dataeng', skills: ['skill-spark', 'skill-kafka', 'skill-aws', 'skill-airflow'] },
  { id: 'job-18', title: 'DevOps Engineer', experienceLevel: 'Mid-Level', location: 'Remote', salaryRange: '$120k–$160k', companyId: 'co-microsoft', careerRoleId: 'cr-devops', skills: ['skill-docker', 'skill-kubernetes', 'skill-cicd'] },
  { id: 'job-19', title: 'Platform Engineer', experienceLevel: 'Senior', location: 'San Francisco, CA', salaryRange: '$150k–$200k', companyId: 'co-stripe', careerRoleId: 'cr-devops', skills: ['skill-kubernetes', 'skill-aws', 'skill-cicd', 'skill-python'] },
  { id: 'job-20', title: 'AI Researcher', experienceLevel: 'Senior', location: 'San Francisco, CA', salaryRange: '$200k–$350k', companyId: 'co-openai', careerRoleId: 'cr-airesearcher', skills: ['skill-python', 'skill-dl', 'skill-pytorch', 'skill-nlp'] },
  { id: 'job-21', title: 'React Native Developer', experienceLevel: 'Mid-Level', location: 'Remote', salaryRange: '$120k–$160k', companyId: 'co-spotify', careerRoleId: 'cr-mobile', skills: ['skill-reactnative', 'skill-javascript', 'skill-typescript'] },
  { id: 'job-22', title: 'LLM Engineer', experienceLevel: 'Mid-Level', location: 'San Francisco, CA', salaryRange: '$180k–$240k', companyId: 'co-openai', careerRoleId: 'cr-llmeng', skills: ['skill-python', 'skill-llm', 'skill-prompteng', 'skill-fastapi'] },
  { id: 'job-23', title: 'AI Product Engineer', experienceLevel: 'Senior', location: 'Seattle, WA', salaryRange: '$160k–$220k', companyId: 'co-microsoft', careerRoleId: 'cr-llmeng', skills: ['skill-python', 'skill-llm', 'skill-prompteng'] },
  { id: 'job-24', title: 'Site Reliability Engineer', experienceLevel: 'Senior', location: 'Mountain View, CA', salaryRange: '$170k–$230k', companyId: 'co-google', careerRoleId: 'cr-sre', skills: ['skill-kubernetes', 'skill-docker', 'skill-cicd', 'skill-python'] },
  { id: 'job-25', title: 'Cloud Solutions Architect', experienceLevel: 'Senior', location: 'Seattle, WA', salaryRange: '$180k–$250k', companyId: 'co-amazon', careerRoleId: 'cr-cloud', skills: ['skill-aws', 'skill-kubernetes', 'skill-docker', 'skill-sysdesign'] },
  { id: 'job-26', title: 'Security Engineer', experienceLevel: 'Mid-Level', location: 'Remote', salaryRange: '$130k–$170k', companyId: 'co-google', careerRoleId: 'cr-security', skills: ['skill-security', 'skill-python', 'skill-docker'] },
  { id: 'job-27', title: 'Solutions Architect', experienceLevel: 'Senior', location: 'Redmond, WA', salaryRange: '$160k–$220k', companyId: 'co-microsoft', careerRoleId: 'cr-sysdesign', skills: ['skill-sysdesign', 'skill-aws', 'skill-restapi'] },
  { id: 'job-28', title: 'Junior Frontend Developer', experienceLevel: 'Entry-Level', location: 'New York, NY', salaryRange: '$75k–$100k', companyId: 'co-airbnb', careerRoleId: 'cr-frontend', skills: ['skill-html', 'skill-javascript', 'skill-react'] },
  { id: 'job-29', title: 'Junior Data Scientist', experienceLevel: 'Entry-Level', location: 'San Francisco, CA', salaryRange: '$90k–$120k', companyId: 'co-uber', careerRoleId: 'cr-datascientist', skills: ['skill-python', 'skill-pandas', 'skill-sklearn', 'skill-sql'] },
  { id: 'job-30', title: 'Junior Python Developer', experienceLevel: 'Entry-Level', location: 'Remote', salaryRange: '$70k–$95k', companyId: 'co-stripe', careerRoleId: 'cr-backend', skills: ['skill-python', 'skill-fastapi', 'skill-sql'] },
];

const courses = [
  { id: 'crs-1', title: 'Complete Python Bootcamp', platform: 'Udemy', difficulty: 'Beginner', duration: '6 weeks', skillId: 'skill-python' },
  { id: 'crs-2', title: 'Modern JavaScript from the Beginning', platform: 'Udemy', difficulty: 'Beginner', duration: '5 weeks', skillId: 'skill-javascript' },
  { id: 'crs-3', title: 'React – The Complete Guide', platform: 'Udemy', difficulty: 'Intermediate', duration: '8 weeks', skillId: 'skill-react' },
  { id: 'crs-4', title: 'SQL for Data Analysis', platform: 'Udacity', difficulty: 'Beginner', duration: '4 weeks', skillId: 'skill-sql' },
  { id: 'crs-5', title: 'NumPy for Data Science', platform: 'DataCamp', difficulty: 'Beginner', duration: '3 weeks', skillId: 'skill-numpy' },
  { id: 'crs-6', title: 'Pandas Fundamentals', platform: 'DataCamp', difficulty: 'Beginner', duration: '4 weeks', skillId: 'skill-pandas' },
  { id: 'crs-7', title: 'Machine Learning Specialization', platform: 'Coursera', difficulty: 'Intermediate', duration: '12 weeks', skillId: 'skill-ml' },
  { id: 'crs-8', title: 'Machine Learning A-Z', platform: 'Udemy', difficulty: 'Intermediate', duration: '8 weeks', skillId: 'skill-sklearn' },
  { id: 'crs-9', title: 'Deep Learning Specialization', platform: 'Coursera', difficulty: 'Advanced', duration: '16 weeks', skillId: 'skill-dl' },
  { id: 'crs-10', title: 'PyTorch for Deep Learning', platform: 'Udemy', difficulty: 'Advanced', duration: '10 weeks', skillId: 'skill-pytorch' },
  { id: 'crs-11', title: 'TensorFlow Developer Certificate', platform: 'Coursera', difficulty: 'Advanced', duration: '12 weeks', skillId: 'skill-tensorflow' },
  { id: 'crs-12', title: 'NLP with Python', platform: 'Udemy', difficulty: 'Advanced', duration: '8 weeks', skillId: 'skill-nlp' },
  { id: 'crs-13', title: 'Docker & Kubernetes: The Complete Guide', platform: 'Udemy', difficulty: 'Intermediate', duration: '8 weeks', skillId: 'skill-docker' },
  { id: 'crs-14', title: 'Kubernetes for Developers', platform: 'Linux Foundation', difficulty: 'Advanced', duration: '10 weeks', skillId: 'skill-kubernetes' },
  { id: 'crs-15', title: 'AWS Certified Solutions Architect', platform: 'AWS Training', difficulty: 'Advanced', duration: '12 weeks', skillId: 'skill-aws' },
  { id: 'crs-16', title: 'Node.js Developer Course', platform: 'Udemy', difficulty: 'Intermediate', duration: '8 weeks', skillId: 'skill-nodejs' },
  { id: 'crs-17', title: 'TypeScript Masterclass', platform: 'Udemy', difficulty: 'Intermediate', duration: '5 weeks', skillId: 'skill-typescript' },
  { id: 'crs-18', title: 'Next.js & React – Complete Guide', platform: 'Udemy', difficulty: 'Intermediate', duration: '7 weeks', skillId: 'skill-nextjs' },
  { id: 'crs-19', title: 'Apache Spark with Python (PySpark)', platform: 'Udemy', difficulty: 'Advanced', duration: '10 weeks', skillId: 'skill-spark' },
  { id: 'crs-20', title: 'Statistics for Data Science', platform: 'edX', difficulty: 'Intermediate', duration: '6 weeks', skillId: 'skill-stats' },
  { id: 'crs-21', title: 'Tableau Desktop Specialist', platform: 'Tableau', difficulty: 'Intermediate', duration: '4 weeks', skillId: 'skill-tableau' },
  { id: 'crs-22', title: 'CI/CD with GitHub Actions', platform: 'GitHub Learning', difficulty: 'Intermediate', duration: '3 weeks', skillId: 'skill-cicd' },
  { id: 'crs-23', title: 'Computer Vision with PyTorch', platform: 'fast.ai', difficulty: 'Advanced', duration: '8 weeks', skillId: 'skill-cv' },
  { id: 'crs-24', title: 'LLM Engineering: Master AI & Large Language Models', platform: 'Udemy', difficulty: 'Advanced', duration: '12 weeks', skillId: 'skill-llm' },
  { id: 'crs-25', title: 'Prompt Engineering for Developers', platform: 'DeepLearning.AI', difficulty: 'Intermediate', duration: '2 weeks', skillId: 'skill-prompteng' },
  { id: 'crs-26', title: 'React Native – The Practical Guide', platform: 'Udemy', difficulty: 'Intermediate', duration: '6 weeks', skillId: 'skill-reactnative' },
  { id: 'crs-27', title: 'FastAPI – Modern Python APIs', platform: 'TestDriven.io', difficulty: 'Intermediate', duration: '5 weeks', skillId: 'skill-fastapi' },
  { id: 'crs-28', title: 'PostgreSQL for Beginners', platform: 'Udemy', difficulty: 'Beginner', duration: '4 weeks', skillId: 'skill-postgres' },
  { id: 'crs-29', title: 'Git & GitHub Crash Course', platform: 'freeCodeCamp', difficulty: 'Beginner', duration: '2 weeks', skillId: 'skill-git' },
  { id: 'crs-30', title: 'System Design Interview Course', platform: 'Educative.io', difficulty: 'Advanced', duration: '10 weeks', skillId: 'skill-sysdesign' },
];

const projects = [
  { id: 'proj-1', name: 'AI Skin Disease Detection', description: 'CNN-based image classifier for skin disease detection.', difficulty: 'Advanced', technologies: ['tech-python', 'tech-pytorch', 'tech-flask'], skills: ['skill-python', 'skill-pytorch', 'skill-dl', 'skill-cv'] },
  { id: 'proj-2', name: 'E-Commerce Platform', description: 'Full-stack online store with payment integration.', difficulty: 'Intermediate', technologies: ['tech-react', 'tech-nodejs', 'tech-mongodb'], skills: ['skill-react', 'skill-nodejs', 'skill-mongodb', 'skill-restapi'] },
  { id: 'proj-3', name: 'Real-time Chat App', description: 'WebSocket-based group chat application.', difficulty: 'Intermediate', technologies: ['tech-react', 'tech-nodejs', 'tech-redis'], skills: ['skill-react', 'skill-nodejs', 'skill-redis'] },
  { id: 'proj-4', name: 'Customer Churn Predictor', description: 'ML model to predict customer churn using tabular data.', difficulty: 'Intermediate', technologies: ['tech-python'], skills: ['skill-python', 'skill-pandas', 'skill-sklearn', 'skill-stats', 'skill-ml'] },
  { id: 'proj-5', name: 'Stock Price Predictor', description: 'LSTM model for time-series stock price prediction.', difficulty: 'Advanced', technologies: ['tech-python', 'tech-tensorflow'], skills: ['skill-python', 'skill-dl', 'skill-tensorflow', 'skill-pandas'] },
  { id: 'proj-6', name: 'Portfolio Website', description: 'Personal developer portfolio with animations.', difficulty: 'Beginner', technologies: ['tech-react', 'tech-tailwind'], skills: ['skill-react', 'skill-html', 'skill-javascript'] },
  { id: 'proj-7', name: 'Data Pipeline for Analytics', description: 'Automated ETL pipeline with Airflow and Spark.', difficulty: 'Advanced', technologies: ['tech-spark', 'tech-kafka', 'tech-python'], skills: ['skill-spark', 'skill-kafka', 'skill-python', 'skill-airflow'] },
  { id: 'proj-8', name: 'GPT-based Resume Analyzer', description: 'LLM-powered tool that analyzes resumes and suggests improvements.', difficulty: 'Advanced', technologies: ['tech-python', 'tech-fastapi'], skills: ['skill-python', 'skill-llm', 'skill-prompteng', 'skill-fastapi'] },
  { id: 'proj-9', name: 'CI/CD Pipeline Setup', description: 'GitHub Actions-based deployment pipeline for a Node.js app.', difficulty: 'Intermediate', technologies: ['tech-docker', 'tech-kubernetes'], skills: ['skill-docker', 'skill-kubernetes', 'skill-cicd'] },
  { id: 'proj-10', name: 'Sentiment Analysis API', description: 'REST API for social media sentiment classification.', difficulty: 'Intermediate', technologies: ['tech-python', 'tech-fastapi'], skills: ['skill-python', 'skill-nlp', 'skill-ml', 'skill-fastapi'] },
  { id: 'proj-11', name: 'Blog CMS', description: 'Content management system with React frontend and Express backend.', difficulty: 'Intermediate', technologies: ['tech-react', 'tech-nodejs', 'tech-postgres'], skills: ['skill-react', 'skill-nodejs', 'skill-sql', 'skill-postgres'] },
  { id: 'proj-12', name: 'Cloud-Native Microservices', description: 'Containerized microservices deployed on Kubernetes.', difficulty: 'Advanced', technologies: ['tech-docker', 'tech-kubernetes', 'tech-aws'], skills: ['skill-docker', 'skill-kubernetes', 'skill-aws', 'skill-cicd'] },
  { id: 'proj-13', name: 'Sales Dashboard', description: 'Interactive sales analytics dashboard with charts.', difficulty: 'Intermediate', technologies: ['tech-python'], skills: ['skill-python', 'skill-pandas', 'skill-matplotlib', 'skill-sql', 'skill-tableau'] },
  { id: 'proj-14', name: 'Next.js Blog', description: 'SSR blog with Next.js, Tailwind and MDX.', difficulty: 'Intermediate', technologies: ['tech-nextjs', 'tech-tailwind'], skills: ['skill-nextjs', 'skill-react', 'skill-typescript'] },
  { id: 'proj-15', name: 'GraphQL API Gateway', description: 'Unified GraphQL API wrapping multiple REST services.', difficulty: 'Advanced', technologies: ['tech-nodejs', 'tech-graphql'], skills: ['skill-nodejs', 'skill-graphql', 'skill-restapi'] },
  { id: 'proj-16', name: 'Mobile Fitness App', description: 'Cross-platform workout tracking app using React Native.', difficulty: 'Intermediate', technologies: ['tech-react', 'tech-nodejs'], skills: ['skill-reactnative', 'skill-javascript', 'skill-typescript'] },
  { id: 'proj-17', name: 'Object Detection System', description: 'YOLO-based real-time object detection with webcam feed.', difficulty: 'Advanced', technologies: ['tech-python', 'tech-pytorch'], skills: ['skill-python', 'skill-pytorch', 'skill-cv', 'skill-dl'] },
  { id: 'proj-18', name: 'Job Board Platform', description: 'Full-stack job posting and application platform.', difficulty: 'Intermediate', technologies: ['tech-react', 'tech-nodejs', 'tech-postgres'], skills: ['skill-react', 'skill-nodejs', 'skill-sql', 'skill-restapi'] },
  { id: 'proj-19', name: 'Fraud Detection System', description: 'ML model detecting fraudulent transactions in real-time.', difficulty: 'Advanced', technologies: ['tech-python', 'tech-spark'], skills: ['skill-python', 'skill-ml', 'skill-sklearn', 'skill-spark', 'skill-stats'] },
  { id: 'proj-20', name: 'Discord Bot', description: 'Custom Discord bot with slash commands and LLM integration.', difficulty: 'Intermediate', technologies: ['tech-nodejs', 'tech-python'], skills: ['skill-nodejs', 'skill-python', 'skill-prompteng'] },
];

const students = [
  {
    id: 'student-1', name: 'Ravi Sharma', email: 'ravi@example.com', educationLevel: 'Bachelor',
    skills: [['skill-python', 'Intermediate'], ['skill-sql', 'Intermediate'], ['skill-pandas', 'Beginner'], ['skill-html', 'Beginner'], ['skill-git', 'Beginner']],
    targetCareer: 'cr-mleng', projects: ['proj-4', 'proj-6'],
  },
  {
    id: 'student-2', name: 'Priya Patel', email: 'priya@example.com', educationLevel: 'Master',
    skills: [['skill-javascript', 'Advanced'], ['skill-react', 'Intermediate'], ['skill-nodejs', 'Intermediate'], ['skill-sql', 'Intermediate'], ['skill-typescript', 'Beginner']],
    targetCareer: 'cr-fullstack', projects: ['proj-2', 'proj-3'],
  },
  {
    id: 'student-3', name: 'Arjun Kumar', email: 'arjun@example.com', educationLevel: 'Bachelor',
    skills: [['skill-python', 'Advanced'], ['skill-ml', 'Intermediate'], ['skill-sklearn', 'Intermediate'], ['skill-pandas', 'Intermediate'], ['skill-numpy', 'Intermediate']],
    targetCareer: 'cr-datascientist', projects: ['proj-4', 'proj-5'],
  },
  {
    id: 'student-4', name: 'Meera Nair', email: 'meera@example.com', educationLevel: 'Bachelor',
    skills: [['skill-react', 'Intermediate'], ['skill-html', 'Intermediate'], ['skill-javascript', 'Intermediate'], ['skill-git', 'Beginner']],
    targetCareer: 'cr-frontend', projects: ['proj-6', 'proj-14'],
  },
  {
    id: 'student-5', name: 'Aditya Singh', email: 'aditya@example.com', educationLevel: 'Master',
    skills: [['skill-python', 'Advanced'], ['skill-pytorch', 'Intermediate'], ['skill-dl', 'Intermediate'], ['skill-ml', 'Advanced'], ['skill-nlp', 'Beginner']],
    targetCareer: 'cr-airesearcher', projects: ['proj-1', 'proj-10'],
  },
  {
    id: 'student-6', name: 'Kavya Reddy', email: 'kavya@example.com', educationLevel: 'Bachelor',
    skills: [['skill-docker', 'Intermediate'], ['skill-kubernetes', 'Beginner'], ['skill-cicd', 'Beginner'], ['skill-python', 'Intermediate'], ['skill-git', 'Intermediate']],
    targetCareer: 'cr-devops', projects: ['proj-9', 'proj-12'],
  },
  {
    id: 'student-7', name: 'Rohit Verma', email: 'rohit@example.com', educationLevel: 'Bachelor',
    skills: [['skill-sql', 'Advanced'], ['skill-python', 'Intermediate'], ['skill-pandas', 'Intermediate'], ['skill-tableau', 'Beginner']],
    targetCareer: 'cr-dataanalyst', projects: ['proj-13'],
  },
  {
    id: 'student-8', name: 'Sneha Joshi', email: 'sneha@example.com', educationLevel: 'Bachelor',
    skills: [['skill-javascript', 'Beginner'], ['skill-html', 'Intermediate'], ['skill-react', 'Beginner']],
    targetCareer: 'cr-frontend', projects: ['proj-6'],
  },
  {
    id: 'student-9', name: 'Vikram Mehta', email: 'vikram@example.com', educationLevel: 'Master',
    skills: [['skill-python', 'Advanced'], ['skill-spark', 'Intermediate'], ['skill-airflow', 'Intermediate'], ['skill-sql', 'Advanced'], ['skill-kafka', 'Beginner']],
    targetCareer: 'cr-dataeng', projects: ['proj-7'],
  },
  {
    id: 'student-10', name: 'Divya Krishnan', email: 'divya@example.com', educationLevel: 'Bachelor',
    skills: [['skill-python', 'Beginner'], ['skill-ml', 'Beginner'], ['skill-stats', 'Intermediate']],
    targetCareer: 'cr-datascientist', projects: [],
  },
  {
    id: 'student-11', name: 'Ankit Gupta', email: 'ankit@example.com', educationLevel: 'Bachelor',
    skills: [['skill-javascript', 'Intermediate'], ['skill-reactnative', 'Intermediate'], ['skill-typescript', 'Beginner'], ['skill-git', 'Intermediate']],
    targetCareer: 'cr-mobile', projects: ['proj-16'],
  },
  {
    id: 'student-12', name: 'Pooja Iyer', email: 'pooja@example.com', educationLevel: 'Master',
    skills: [['skill-python', 'Advanced'], ['skill-llm', 'Intermediate'], ['skill-prompteng', 'Intermediate'], ['skill-fastapi', 'Intermediate']],
    targetCareer: 'cr-llmeng', projects: ['proj-8', 'proj-20'],
  },
  {
    id: 'student-13', name: 'Raj Bhatia', email: 'raj@example.com', educationLevel: 'Bachelor',
    skills: [['skill-aws', 'Intermediate'], ['skill-docker', 'Advanced'], ['skill-kubernetes', 'Intermediate'], ['skill-cicd', 'Intermediate'], ['skill-sysdesign', 'Beginner']],
    targetCareer: 'cr-cloud', projects: ['proj-12'],
  },
  {
    id: 'student-14', name: 'Nisha Kapoor', email: 'nisha@example.com', educationLevel: 'Bachelor',
    skills: [['skill-security', 'Intermediate'], ['skill-python', 'Intermediate'], ['skill-docker', 'Beginner'], ['skill-git', 'Intermediate']],
    targetCareer: 'cr-security', projects: [],
  },
  {
    id: 'student-15', name: 'Siddharth Roy', email: 'sid@example.com', educationLevel: 'Master',
    skills: [['skill-python', 'Advanced'], ['skill-nodejs', 'Intermediate'], ['skill-sysdesign', 'Intermediate'], ['skill-sql', 'Advanced'], ['skill-restapi', 'Intermediate'], ['skill-aws', 'Beginner']],
    targetCareer: 'cr-sysdesign', projects: ['proj-15', 'proj-18'],
  },
  {
    id: 'student-16', name: 'Tanvi Shah', email: 'tanvi@example.com', educationLevel: 'Bachelor',
    skills: [['skill-python', 'Intermediate'], ['skill-dl', 'Beginner'], ['skill-cv', 'Beginner'], ['skill-pytorch', 'Beginner']],
    targetCareer: 'cr-mleng', projects: ['proj-1', 'proj-17'],
  },
  {
    id: 'student-17', name: 'Harsh Malhotra', email: 'harsh@example.com', educationLevel: 'Bachelor',
    skills: [['skill-javascript', 'Advanced'], ['skill-typescript', 'Intermediate'], ['skill-nextjs', 'Intermediate'], ['skill-react', 'Advanced'], ['skill-nodejs', 'Beginner']],
    targetCareer: 'cr-frontend', projects: ['proj-14', 'proj-11'],
  },
  {
    id: 'student-18', name: 'Ishita Desai', email: 'ishita@example.com', educationLevel: 'Master',
    skills: [['skill-python', 'Intermediate'], ['skill-stats', 'Advanced'], ['skill-sql', 'Intermediate'], ['skill-pandas', 'Intermediate'], ['skill-matplotlib', 'Intermediate']],
    targetCareer: 'cr-datascientist', projects: ['proj-13'],
  },
  {
    id: 'student-19', name: 'Kiran Rao', email: 'kiran@example.com', educationLevel: 'Bachelor',
    skills: [['skill-python', 'Beginner']],
    targetCareer: 'cr-mleng', projects: [],
  },
  {
    id: 'student-20', name: 'Mohan Das', email: 'mohan@example.com', educationLevel: 'Bachelor',
    skills: [],
    targetCareer: null, projects: [],
  },
];

// ─── Fast Batch Seeding ───────────────────────────────────────────────────────

async function seedDatabase() {
  const session = driver.session();
  console.log('\n🌱 SkillOS High-Performance Batch Seeding Starting...\n');

  try {
    console.log('  1. Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log(`  2. Seeding ${skills.length} skills...`);
    await session.run(
      `UNWIND $skills AS s
       MERGE (n:Skill {id: s.id})
       SET n.name = s.name, n.category = s.category, n.difficulty = s.difficulty`,
      { skills }
    );

    console.log(`  3. Seeding ${prerequisites.length} prerequisite relationships...`);
    await session.run(
      `UNWIND $prerequisites AS p
       MATCH (a:Skill {id: p[0]}), (b:Skill {id: p[1]})
       MERGE (a)-[:PREREQUISITE_OF]->(b)`,
      { prerequisites }
    );

    console.log(`  4. Seeding ${technologies.length} technologies...`);
    await session.run(
      `UNWIND $technologies AS t
       MERGE (n:Technology {id: t.id})
       SET n.name = t.name, n.category = t.category`,
      { technologies }
    );

    console.log(`  5. Seeding ${companies.length} companies...`);
    await session.run(
      `UNWIND $companies AS c
       MERGE (n:Company {id: c.id})
       SET n.name = c.name, n.industry = c.industry`,
      { companies }
    );

    console.log(`  6. Seeding ${careerRoles.length} career roles and requirements...`);
    await session.run(
      `UNWIND $careerRoles AS cr
       MERGE (n:CareerRole {id: cr.id})
       SET n.title = cr.title, n.description = cr.description`,
      { careerRoles }
    );

    await session.run(
      `UNWIND $careerSkills AS cs
       MATCH (cr:CareerRole {id: cs[0]}), (s:Skill {id: cs[1]})
       MERGE (cr)-[r:REQUIRES]->(s)
       SET r.importance = cs[2]`,
      { careerSkills }
    );

    await session.run(
      `UNWIND $careerLeadsTo AS cl
       MATCH (a:CareerRole {id: cl[0]}), (b:CareerRole {id: cl[1]})
       MERGE (a)-[:LEADS_TO]->(b)`,
      { careerLeadsTo }
    );

    console.log(`  7. Seeding ${jobs.length} jobs and connections...`);
    const jobList = jobs.map(j => ({
      id: j.id,
      title: j.title,
      experienceLevel: j.experienceLevel,
      location: j.location,
      salaryRange: j.salaryRange,
      companyId: j.companyId,
      careerRoleId: j.careerRoleId,
    }));

    await session.run(
      `UNWIND $jobList AS j
       MERGE (n:Job {id: j.id})
       SET n.title = j.title, n.experienceLevel = j.experienceLevel, n.location = j.location, n.salaryRange = j.salaryRange`,
      { jobList }
    );

    await session.run(
      `UNWIND $jobList AS j
       MATCH (job:Job {id: j.id}), (comp:Company {id: j.companyId})
       MERGE (job)-[:OFFERED_BY]->(comp)`,
      { jobList }
    );

    await session.run(
      `UNWIND $jobList AS j
       MATCH (job:Job {id: j.id}), (cr:CareerRole {id: j.careerRoleId})
       MERGE (job)-[:FOR_ROLE]->(cr)`,
      { jobList }
    );

    const jobSkillPairs = [];
    jobs.forEach(j => {
      j.skills.forEach(skillId => {
        jobSkillPairs.push([j.id, skillId]);
      });
    });

    await session.run(
      `UNWIND $jobSkillPairs AS pair
       MATCH (job:Job {id: pair[0]}), (s:Skill {id: pair[1]})
       MERGE (job)-[:REQUIRES]->(s)`,
      { jobSkillPairs }
    );

    console.log(`  8. Seeding ${courses.length} courses...`);
    await session.run(
      `UNWIND $courses AS c
       MERGE (n:Course {id: c.id})
       SET n.title = c.title, n.platform = c.platform, n.difficulty = c.difficulty, n.duration = c.duration`,
      { courses }
    );

    await session.run(
      `UNWIND $courses AS c
       MATCH (crs:Course {id: c.id}), (s:Skill {id: c.skillId})
       MERGE (crs)-[:TEACHES]->(s)`,
      { courses }
    );

    console.log(`  9. Seeding ${projects.length} projects...`);
    const projectList = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      difficulty: p.difficulty,
    }));

    await session.run(
      `UNWIND $projectList AS p
       MERGE (n:Project {id: p.id})
       SET n.name = p.name, n.description = p.description, n.difficulty = p.difficulty`,
      { projectList }
    );

    const projTechPairs = [];
    const projSkillPairs = [];
    projects.forEach(p => {
      p.technologies.forEach(t => projTechPairs.push([p.id, t]));
      p.skills.forEach(s => projSkillPairs.push([p.id, s]));
    });

    await session.run(
      `UNWIND $projTechPairs AS pair
       MATCH (p:Project {id: pair[0]}), (t:Technology {id: pair[1]})
       MERGE (p)-[:USES_TECHNOLOGY]->(t)`,
      { projTechPairs }
    );

    await session.run(
      `UNWIND $projSkillPairs AS pair
       MATCH (p:Project {id: pair[0]}), (s:Skill {id: pair[1]})
       MERGE (p)-[:DEMONSTRATES]->(s)`,
      { projSkillPairs }
    );

    console.log(`  10. Seeding ${students.length} students...`);
    const studentList = students.map(st => ({
      id: st.id,
      name: st.name,
      email: st.email,
      educationLevel: st.educationLevel,
    }));

    await session.run(
      `UNWIND $studentList AS st
       MERGE (p:Person {id: st.id})
       SET p.name = st.name, p.email = st.email, p.educationLevel = st.educationLevel`,
      { studentList }
    );

    const studentSkillTriples = [];
    const studentCareerPairs = [];
    const studentProjectPairs = [];

    students.forEach(st => {
      st.skills.forEach(([skillId, prof]) => {
        studentSkillTriples.push({ personId: st.id, skillId, proficiency: prof });
      });
      if (st.targetCareer) {
        studentCareerPairs.push([st.id, st.targetCareer]);
      }
      st.projects.forEach(projId => {
        studentProjectPairs.push([st.id, projId]);
      });
    });

    await session.run(
      `UNWIND $studentSkillTriples AS item
       MATCH (p:Person {id: item.personId}), (s:Skill {id: item.skillId})
       MERGE (p)-[r:HAS_SKILL]->(s)
       SET r.proficiency = item.proficiency`,
      { studentSkillTriples }
    );

    await session.run(
      `UNWIND $studentCareerPairs AS pair
       MATCH (p:Person {id: pair[0]}), (cr:CareerRole {id: pair[1]})
       MERGE (p)-[:TARGETS]->(cr)`,
      { studentCareerPairs }
    );

    await session.run(
      `UNWIND $studentProjectPairs AS pair
       MATCH (p:Person {id: pair[0]}), (proj:Project {id: pair[1]})
       MERGE (p)-[:WORKED_ON]->(proj)`,
      { studentProjectPairs }
    );

    console.log('\n✅  Fast batch seeding complete!\n');
    console.log('Seeded Graph Summary:');
    console.log(`  • ${students.length} students (Person)`);
    console.log(`  • ${skills.length} skills (Skill)`);
    console.log(`  • ${prerequisites.length} prerequisite relationships (PREREQUISITE_OF)`);
    console.log(`  • ${technologies.length} technologies (Technology)`);
    console.log(`  • ${projects.length} projects (Project)`);
    console.log(`  • ${careerRoles.length} career roles (CareerRole)`);
    console.log(`  • ${jobs.length} jobs (Job)`);
    console.log(`  • ${companies.length} companies (Company)`);
    console.log(`  • ${courses.length} courses (Course)\n`);
  } catch (err) {
    console.error('❌  Batch seed error:', err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();
