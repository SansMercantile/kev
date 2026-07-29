// KEV Educational System Interactive Features
// Knowledge | Education | Vision - Comprehensive Educational Platform

class KEVEducationalSystem {
    constructor() {
        this.agents = new Map();
        this.categories = new Map();
        this.metrics = new Map();
        this.charts = new Map();
        this.updateInterval = null;
        this.currentCategory = null;
        this.init();
    }

    init() {
        this.initializeCategories();
        this.initializeAgents();
        this.initializeMetrics();
        this.initializeCharts();
        this.startRealTimeUpdates();
        this.setupEventListeners();
        this.animateCounters();
        this.initializeTabs();
    }

    // Educational Categories Management
    initializeCategories() {
        const categories = [
            {
                id: 'dream-based-education',
                name: 'Dream-Based Education & Subconscious Learning',
                description: 'Advanced learning through dream analysis and subconscious processing',
                color: '#EC4899',
                icon: '🌙',
                agentCount: 32,
                features: [
                    'Dream classroom environments',
                    'Subconscious learning optimization',
                    'Archetypal teaching methods',
                    'Lucid curriculum development',
                    'Multilingual dream education',
                    'Memory consolidation learning'
                ]
            },
            {
                id: 'education-knowledge',
                name: 'Education & Knowledge Management',
                description: 'Comprehensive educational content and knowledge systems',
                color: '#3B82F6',
                icon: '📚',
                agentCount: 47,
                features: [
                    'Curriculum design and development',
                    'Interactive tutorial systems',
                    'Learning analytics and personalization',
                    'Knowledge graph management',
                    'Assessment and certification',
                    'E-learning platform integration'
                ]
            },
            {
                id: 'education-policy',
                name: 'Education Policy & Reform',
                description: 'Strategic policy development and educational reform initiatives',
                color: '#EF4444',
                icon: '🏛️',
                agentCount: 40,
                features: [
                    'Education policy analysis',
                    'Curriculum reform strategies',
                    'Educational equity initiatives',
                    'Funding optimization',
                    'Governance and compliance',
                    'Legislative advocacy'
                ]
            },
            {
                id: 'hr-talent',
                name: 'HR & Talent Management',
                description: 'Comprehensive human resources and talent development systems',
                color: '#8B5CF6',
                icon: '👥',
                agentCount: 43,
                features: [
                    'Talent acquisition and recruitment',
                    'Performance management systems',
                    'Learning and development',
                    'Employee engagement and wellness',
                    'Compensation analysis',
                    'Workforce analytics'
                ]
            },
            {
                id: 'multispecies-education',
                name: 'Multispecies Education & Cross-Kin Learning',
                description: 'Innovative cross-species educational approaches and empathy development',
                color: '#10B981',
                icon: '🌍',
                agentCount: 27,
                features: [
                    'Cross-kin learning models',
                    'Empathy translation systems',
                    'Interspecies curriculum design',
                    'Sensory learning models',
                    'Multilingual multispecies education',
                    'Cross-species communication'
                ]
            },
            {
                id: 'mythic-education',
                name: 'Mythic Education & Archetypal Learning',
                description: 'Narrative-based learning through mythic structures and archetypes',
                color: '#F59E0B',
                icon: '🎭',
                agentCount: 25,
                features: [
                    'Archetypal curriculum design',
                    'Mythic classroom environments',
                    'Narrative learning paths',
                    'Symbolic teaching methods',
                    'Multilingual mythic education',
                    'Story-based assessment'
                ]
            }
        ];

        categories.forEach(category => {
            this.categories.set(category.id, {
                ...category,
                lastUpdate: Date.now(),
                activeAgents: 0,
                totalSessions: Math.floor(Math.random() * 10000),
                completionRate: 85 + Math.random() * 15
            });
        });
    }

    // Agent Management System
    initializeAgents() {
        const agentData = [
            // Dream-Based Education Agents
            { id: 'dream-education-agent', name: 'Dream Education Agent', category: 'dream-based-education', status: 'active', role: 'Core dream learning coordination' },
            { id: 'archetypal-teaching-agent', name: 'Archetypal Teaching Agent', category: 'dream-based-education', status: 'active', role: 'Archetype-based instruction' },
            { id: 'dream-classroom-agent', name: 'Dream Classroom Agent', category: 'dream-based-education', status: 'active', role: 'Virtual dream environment management' },
            { id: 'subconscious-learning-agent', name: 'Subconscious Learning Agent', category: 'dream-based-education', status: 'active', role: 'Subconscious process optimization' },
            { id: 'lucid-curriculum-agent', name: 'Lucid Curriculum Agent', category: 'dream-based-education', status: 'idle', role: 'Lucid dream curriculum design' },
            
            // Education & Knowledge Agents
            { id: 'education-advisor-agent', name: 'Education Advisor Agent', category: 'education-knowledge', status: 'active', role: 'Educational guidance and counseling' },
            { id: 'curriculum-designer-agent', name: 'Curriculum Designer Agent', category: 'education-knowledge', status: 'active', role: 'Curriculum development and design' },
            { id: 'learning-analytics-agent', name: 'Learning Analytics Agent', category: 'education-knowledge', status: 'active', role: 'Learning data analysis and insights' },
            { id: 'knowledge-graph-agent', name: 'Knowledge Graph Agent', category: 'education-knowledge', status: 'active', role: 'Knowledge mapping and organization' },
            { id: 'assessment-agent', name: 'Assessment Agent', category: 'education-knowledge', status: 'active', role: 'Educational assessment and evaluation' },
            
            // Education Policy Agents
            { id: 'education-policy-agent', name: 'Education Policy Agent', category: 'education-policy', status: 'active', role: 'Policy analysis and development' },
            { id: 'curriculum-reform-agent', name: 'Curriculum Reform Agent', category: 'education-policy', status: 'active', role: 'Curriculum reform initiatives' },
            { id: 'education-equity-agent', name: 'Education Equity Agent', category: 'education-policy', status: 'active', role: 'Educational equity and inclusion' },
            { id: 'education-funding-agent', name: 'Education Funding Agent', category: 'education-policy', status: 'idle', role: 'Funding optimization and management' },
            { id: 'education-governance-agent', name: 'Education Governance Agent', category: 'education-policy', status: 'active', role: 'Educational governance systems' },
            
            // HR & Talent Agents
            { id: 'talent-acquisition-agent', name: 'Talent Acquisition Agent', category: 'hr-talent', status: 'active', role: 'Recruitment and talent sourcing' },
            { id: 'performance-review-agent', name: 'Performance Review Agent', category: 'hr-talent', status: 'active', role: 'Performance evaluation and management' },
            { id: 'learning-development-agent', name: 'Learning Development Agent', category: 'hr-talent', status: 'active', role: 'Employee learning and development' },
            { id: 'employee-engagement-agent', name: 'Employee Engagement Agent', category: 'hr-talent', status: 'active', role: 'Employee engagement and satisfaction' },
            { id: 'workforce-analytics-agent', name: 'Workforce Analytics Agent', category: 'hr-talent', status: 'active', role: 'Workforce data analysis and insights' },
            
            // Multispecies Education Agents
            { id: 'multispecies-education-agent', name: 'Multispecies Education Agent', category: 'multispecies-education', status: 'active', role: 'Cross-species educational coordination' },
            { id: 'cross-kin-learning-agent', name: 'Cross-Kin Learning Agent', category: 'multispecies-education', status: 'active', role: 'Cross-kin learning methodologies' },
            { id: 'empathy-translation-agent', name: 'Empathy Translation Agent', category: 'multispecies-education', status: 'active', role: 'Empathy and understanding development' },
            { id: 'interspecies-curriculum-agent', name: 'Interspecies Curriculum Agent', category: 'multispecies-education', status: 'idle', role: 'Interspecies curriculum design' },
            { id: 'sensory-learning-model-agent', name: 'Sensory Learning Model Agent', category: 'multispecies-education', status: 'active', role: 'Sensory-based learning approaches' },
            
            // Mythic Education Agents
            { id: 'mythic-education-agent', name: 'Mythic Education Agent', category: 'mythic-education', status: 'active', role: 'Mythic-based educational coordination' },
            { id: 'archetypal-curriculum-agent', name: 'Archetypal Curriculum Agent', category: 'mythic-education', status: 'active', role: 'Archetypal curriculum development' },
            { id: 'mythic-classroom-agent', name: 'Mythic Classroom Agent', category: 'mythic-education', status: 'active', role: 'Mythic learning environment creation' },
            { id: 'narrative-learning-path-agent', name: 'Narrative Learning Path Agent', category: 'mythic-education', status: 'active', role: 'Narrative-based learning design' },
            { id: 'symbolic-teaching-agent', name: 'Symbolic Teaching Agent', category: 'mythic-education', status: 'active', role: 'Symbolic teaching methodologies' }
        ];

        agentData.forEach(agent => {
            this.agents.set(agent.id, {
                ...agent,
                lastUpdate: Date.now(),
                performance: Math.random() * 100,
                tasksCompleted: Math.floor(Math.random() * 1000),
                efficiency: 85 + Math.random() * 15,
                sessionsHandled: Math.floor(Math.random() * 5000)
            });
        });

        this.renderCategories();
        this.renderAgentNetwork();
    }

    // Metrics Dashboard
    initializeMetrics() {
        const metricsData = {
            'total-students': { value: 45847, unit: 'students', label: 'Total Students Enrolled', trend: '+12%' },
            'active-sessions': { value: 3847, unit: 'sessions', label: 'Active Learning Sessions', trend: '+8%' },
            'completion-rate': { value: 94.2, unit: '%', label: 'Course Completion Rate', trend: '+3.2%' },
            'satisfaction-score': { value: 4.8, unit: '/5.0', label: 'Student Satisfaction Score', trend: '+0.3' },
            'agents-active': { value: 214, unit: 'agents', label: 'Active Educational Agents', trend: '+15' },
            'learning-hours': { value: 127847, unit: 'hours', label: 'Total Learning Hours', trend: '+18%' },
            'certifications': { value: 8947, unit: 'certificates', label: 'Certifications Awarded', trend: '+22%' },
            'languages-supported': { value: 47, unit: 'languages', label: 'Languages Supported', trend: '+5' }
        };

        Object.entries(metricsData).forEach(([key, data]) => {
            this.metrics.set(key, {
                ...data,
                lastUpdate: Date.now(),
                history: this.generateMetricHistory(data.value)
            });
        });

        this.renderMetricsDashboard();
    }

    generateMetricHistory(currentValue) {
        const history = [];
        for (let i = 0; i < 24; i++) {
            history.push({
                time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
                value: currentValue + (Math.random() - 0.5) * currentValue * 0.1
            });
        }
        return history;
    }

    // Chart System
    initializeCharts() {
        this.createLearningProgressChart();
        this.createCategoryDistributionChart();
        this.createEngagementChart();
    }

    createLearningProgressChart() {
        const canvas = document.getElementById('kev-learning-progress-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.generateLearningProgressData();
        
        this.drawLineChart(ctx, data, {
            title: 'Learning Progress Over Time',
            xLabel: 'Time',
            yLabel: 'Progress %',
            color: '#3B82F6'
        });
    }

    createCategoryDistributionChart() {
        const canvas = document.getElementById('kev-category-distribution-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.generateCategoryDistributionData();
        
        this.drawPieChart(ctx, data, {
            title: 'Educational Category Distribution',
            colors: ['#EC4899', '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#F59E0B']
        });
    }

    createEngagementChart() {
        const canvas = document.getElementById('kev-engagement-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.generateEngagementData();
        
        this.drawBarChart(ctx, data, {
            title: 'Student Engagement by Category',
            xLabel: 'Categories',
            yLabel: 'Engagement %',
            color: '#1E3A8A'
        });
    }

    // Rendering Methods
    renderCategories() {
        const container = document.getElementById('kev-categories');
        if (!container) return;

        let html = '<div class="kev-grid kev-grid-3">';
        
        this.categories.forEach(category => {
            html += `
                <div class="kev-card" data-category-id="${category.id}">
                    <div class="kev-card-header">
                        <div class="kev-card-icon" style="background: ${category.color}">
                            <span style="font-size: 2rem;">${category.icon}</span>
                        </div>
                        <div>
                            <h3 class="kev-card-title">${category.name}</h3>
                            <p class="kev-card-subtitle">${category.agentCount} Educational Agents</p>
                        </div>
                    </div>
                    <p>${category.description}</p>
                    <ul class="kev-feature-list">
                        ${category.features.slice(0, 3).map(feature => `
                            <li>
                                <span class="kev-feature-icon">✓</span>
                                ${feature}
                            </li>
                        `).join('')}
                    </ul>
                    <div style="margin-top: 1.5rem;">
                        <div class="kev-progress">
                            <div class="kev-progress-bar" style="width: ${category.completionRate}%"></div>
                        </div>
                        <small>Completion Rate: ${Math.round(category.completionRate)}%</small>
                    </div>
                    <div style="margin-top: 1rem;">
                        <button class="kev-btn kev-btn-primary" onclick="kevSystem.showCategoryDetails('${category.id}')">
                            Explore Category
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    renderAgentNetwork() {
        const container = document.getElementById('kev-agent-network');
        if (!container) return;

        let html = '';
        const categories = ['dream-based-education', 'education-knowledge', 'education-policy', 'hr-talent', 'multispecies-education', 'mythic-education'];
        
        categories.forEach(categoryId => {
            const category = this.categories.get(categoryId);
            const categoryAgents = Array.from(this.agents.values()).filter(agent => agent.category === categoryId);
            
            html += `
                <div class="kev-card">
                    <div class="kev-card-header">
                        <div class="kev-card-icon" style="background: ${category.color}">
                            <span style="font-size: 2rem;">${category.icon}</span>
                        </div>
                        <div>
                            <h3 class="kev-card-title">${category.name}</h3>
                            <p class="kev-card-subtitle">${categoryAgents.length} Active Agents</p>
                        </div>
                    </div>
                    <div class="kev-grid kev-grid-2">
                        ${categoryAgents.map(agent => this.renderAgentNode(agent)).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderAgentNode(agent) {
        const statusClass = `kev-status-${agent.status}`;
        const statusText = agent.status.charAt(0).toUpperCase() + agent.status.slice(1);
        
        return `
            <div class="kev-agent-node" data-agent-id="${agent.id}">
                <div class="kev-agent-status ${statusClass}"></div>
                <h4>${agent.name}</h4>
                <p><small>${agent.role}</small></p>
                <div class="kev-progress">
                    <div class="kev-progress-bar" style="width: ${agent.performance}%"></div>
                </div>
                <small>Performance: ${Math.round(agent.performance)}%</small>
                <br><small>Sessions: ${agent.sessionsHandled}</small>
            </div>
        `;
    }

    renderMetricsDashboard() {
        const container = document.getElementById('kev-metrics-dashboard');
        if (!container) return;

        let html = '<div class="kev-grid kev-grid-4">';
        
        this.metrics.forEach((metric, key) => {
            const trendClass = metric.trend.startsWith('+') ? 'kev-trend-positive' : 'kev-trend-negative';
            html += `
                <div class="kev-metric">
                    <span class="kev-metric-value">${Math.round(metric.value)}${metric.unit}</span>
                    <span class="kev-metric-label">${metric.label}</span>
                    <div class="kev-metric-trend ${trendClass}">${metric.trend}</div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    // Chart Drawing Methods
    drawLineChart(ctx, data, options) {
        const { width, height } = ctx.canvas;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        ctx.clearRect(0, 0, width, height);

        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw data line
        ctx.strokeStyle = options.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - padding - (point.value / 100) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(options.title, width / 2, 20);
    }

    drawBarChart(ctx, data, options) {
        const { width, height } = ctx.canvas;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        ctx.clearRect(0, 0, width, height);

        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw bars
        data.forEach((item, index) => {
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const barHeight = (item.value / 100) * chartHeight;
            const y = height - padding - barHeight;

            ctx.fillStyle = options.color;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw labels
            ctx.fillStyle = '#666';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth / 2, height - padding + 20);
        });

        // Title
        ctx.fillStyle = '#333';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(options.title, width / 2, 20);
    }

    drawPieChart(ctx, data, options) {
        const { width, height } = ctx.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;

        ctx.clearRect(0, 0, width, height);

        let total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = -Math.PI / 2;

        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = options.colors[index % options.colors.length];
            ctx.fill();

            // Draw labels
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

            ctx.fillStyle = 'white';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(item.value / total * 100)}%`, labelX, labelY);

            currentAngle += sliceAngle;
        });

        // Title
        ctx.fillStyle = '#333';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(options.title, width / 2, 20);
    }

    // Data Generation
    generateLearningProgressData() {
        const data = [];
        for (let i = 0; i < 30; i++) {
            data.push({
                day: i + 1,
                value: Math.min(100, 20 + i * 2.5 + Math.random() * 10)
            });
        }
        return data;
    }

    generateCategoryDistributionData() {
        return [
            { label: 'Dream Education', value: 32 },
            { label: 'Knowledge Management', value: 47 },
            { label: 'Policy & Reform', value: 40 },
            { label: 'HR & Talent', value: 43 },
            { label: 'Multispecies', value: 27 },
            { label: 'Mythic Education', value: 25 }
        ];
    }

    generateEngagementData() {
        return [
            { label: 'Dream', value: 88 },
            { label: 'Knowledge', value: 92 },
            { label: 'Policy', value: 76 },
            { label: 'HR', value: 84 },
            { label: 'Multispecies', value: 79 },
            { label: 'Mythic', value: 81 }
        ];
    }

    // Real-time Updates
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
            this.updateAgentStatus();
            this.updateCharts();
        }, 5000);
    }

    updateMetrics() {
        this.metrics.forEach((metric, key) => {
            const change = (Math.random() - 0.5) * metric.value * 0.02;
            metric.value += change;
            metric.value = Math.max(0, metric.value);
            
            const trendChange = Math.random() > 0.5 ? 1 : -1;
            const trendValue = Math.random() * 5;
            metric.trend = `${trendChange > 0 ? '+' : '-'}${trendValue.toFixed(1)}%`;
            
            metric.history.push({
                time: new Date(),
                value: metric.value
            });
            if (metric.history.length > 24) {
                metric.history.shift();
            }
        });

        this.renderMetricsDashboard();
    }

    updateAgentStatus() {
        this.agents.forEach(agent => {
            if (Math.random() < 0.01) {
                const statuses = ['active', 'idle', 'offline'];
                agent.status = statuses[Math.floor(Math.random() * statuses.length)];
            }
            
            agent.performance = Math.max(0, Math.min(100, 
                agent.performance + (Math.random() - 0.5) * 5
            ));
            
            agent.lastUpdate = Date.now();
        });

        this.renderAgentNetwork();
    }

    updateCharts() {
        this.createLearningProgressChart();
        this.createCategoryDistributionChart();
        this.createEngagementChart();
    }

    // Tab System
    initializeTabs() {
        const tabs = document.querySelectorAll('.kev-tab');
        const contents = document.querySelectorAll('.kev-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(targetId).classList.add('active');
            });
        });
    }

    // Counter Animation
    animateCounters() {
        const counters = document.querySelectorAll('.kev-metric-value');
        counters.forEach(counter => {
            const text = counter.textContent;
            const value = parseFloat(text.replace(/[^\d.-]/g, ''));
            const suffix = text.replace(/[\d.-]/g, '');
            
            let current = 0;
            const increment = value / 100;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    counter.textContent = value + suffix;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + suffix;
                }
            }, 20);
        });
    }

    // Event Listeners
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const agentNode = e.target.closest('.kev-agent-node');
            if (agentNode) {
                const agentId = agentNode.dataset.agentId;
                this.showAgentDetails(agentId);
            }
        });

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    showAgentDetails(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return;

        const modal = document.createElement('div');
        modal.className = 'kev-modal';
        modal.innerHTML = `
            <div class="kev-modal-content">
                <span class="kev-modal-close">&times;</span>
                <h2>${agent.name}</h2>
                <p><strong>Role:</strong> ${agent.role}</p>
                <p><strong>Category:</strong> ${agent.category}</p>
                <p><strong>Status:</strong> ${agent.status}</p>
                <p><strong>Performance:</strong> ${Math.round(agent.performance)}%</p>
                <p><strong>Tasks Completed:</strong> ${agent.tasksCompleted}</p>
                <p><strong>Sessions Handled:</strong> ${agent.sessionsHandled}</p>
                <p><strong>Efficiency:</strong> ${Math.round(agent.efficiency)}%</p>
            </div>
        `;

        document.body.appendChild(modal);
        
        modal.querySelector('.kev-modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showCategoryDetails(categoryId) {
        const category = this.categories.get(categoryId);
        if (!category) return;

        // Navigate to category-specific page or show detailed view
        window.location.href = `${categoryId}.html`;
    }

    // Cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize KEV Educational System when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.kevSystem = new KEVEducationalSystem();
});

// Add modal CSS
const modalCSS = `
.kev-modal {
    display: flex;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    align-items: center;
    justify-content: center;
}

.kev-modal-content {
    background-color: white;
    padding: 30px;
    border-radius: 16px;
    max-width: 600px;
    width: 90%;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.kev-modal-close {
    position: absolute;
    right: 15px;
    top: 15px;
    font-size: 28px;
    cursor: pointer;
    color: #999;
    transition: color 0.3s ease;
}

.kev-modal-close:hover {
    color: #333;
}
`;

const style = document.createElement('style');
style.textContent = modalCSS;
document.head.appendChild(style);
