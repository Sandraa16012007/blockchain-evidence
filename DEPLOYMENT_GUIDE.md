# 🚀 EVID-DGC Deployment Guide

## Phase 1: Core Evidence Management System

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Ethereum testnet (Sepolia) access
- Supabase account (database)

### 1. Smart Contract Deployment

#### Install Hardhat
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

#### Deploy Contract
```bash
# Compile contract
npx hardhat compile

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

#### Contract Address
After deployment, update `evidence-manager.html`:
```javascript
const contractAddress = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

### 2. Database Setup

#### Supabase Tables
```sql
-- Evidence table
CREATE TABLE evidence (
    id SERIAL PRIMARY KEY,
    evidence_id VARCHAR(50) UNIQUE NOT NULL,
    case_id VARCHAR(50) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    evidence_type VARCHAR(50) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    collection_date TIMESTAMP,
    uploaded_by VARCHAR(42) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    blockchain_tx VARCHAR(66),
    status VARCHAR(50) DEFAULT 'uploaded',
    is_sealed BOOLEAN DEFAULT FALSE,
    sealed_by VARCHAR(42),
    sealed_at TIMESTAMP
);

-- Audit log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    log_id VARCHAR(50) UNIQUE NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    action VARCHAR(50) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    details TEXT,
    ip_address INET,
    blockchain_tx VARCHAR(66),
    success BOOLEAN DEFAULT TRUE
);

-- Chain of custody table
CREATE TABLE chain_of_custody (
    id SERIAL PRIMARY KEY,
    evidence_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(42) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    details TEXT,
    blockchain_tx VARCHAR(66),
    FOREIGN KEY (evidence_id) REFERENCES evidence(evidence_id)
);
```

### 3. Environment Configuration

#### Create `.env` file
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Blockchain
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CONTRACT_ADDRESS=your_deployed_contract_address
PRIVATE_KEY=your_deployer_private_key

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_byte_encryption_key

# Analytics
GA_MEASUREMENT_ID=G-KEYDE0ZH4Z
```

### 4. Backend API Setup

#### Install Dependencies
```bash
npm install express cors helmet morgan bcryptjs jsonwebtoken
npm install @supabase/supabase-js web3 multer crypto-js
```

#### Update server.js
```javascript
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Web3 = require('web3');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const web3 = new Web3(process.env.ETHEREUM_RPC_URL);

// Evidence upload endpoint
app.post('/api/evidence/upload', upload.single('file'), async (req, res) => {
    try {
        const { caseId, type, description, location, collectionDate } = req.body;
        const file = req.file;
        
        // Calculate file hash
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        
        // Store in database
        const { data, error } = await supabase
            .from('evidence')
            .insert({
                evidence_id: 'EVD-' + Date.now(),
                case_id: caseId,
                file_hash: fileHash,
                file_name: file.originalname,
                file_size: file.size,
                evidence_type: type,
                description,
                location,
                collection_date: collectionDate,
                uploaded_by: req.user.wallet_address
            });
            
        if (error) throw error;
        
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 5. Frontend Updates

#### Update evidence-manager.html
Replace mock functions with real API calls:

```javascript
async function storeEvidenceData(evidenceData) {
    const response = await fetch('/api/evidence/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(evidenceData)
    });
    
    if (!response.ok) {
        throw new Error('Failed to store evidence');
    }
    
    return response.json();
}
```

### 6. Security Implementation

#### Add Authentication Middleware
```javascript
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.sendStatus(401);
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
```

#### Add Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const uploadLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 uploads per windowMs
    message: 'Too many upload attempts, please try again later.'
});

app.use('/api/evidence/upload', uploadLimit);
```

### 7. Testing

#### Unit Tests
```bash
npm install --save-dev jest supertest
npm test
```

#### Integration Tests
```javascript
// Test evidence upload
test('should upload evidence successfully', async () => {
    const response = await request(app)
        .post('/api/evidence/upload')
        .attach('file', 'test-files/sample.pdf')
        .field('caseId', 'CASE-2024-001')
        .field('type', 'document')
        .expect(200);
        
    expect(response.body.success).toBe(true);
});
```

### 8. Production Deployment

#### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### Deploy to Render.com
1. Connect GitHub repository
2. Set environment variables
3. Deploy with automatic builds

### 9. Monitoring & Maintenance

#### Health Checks
```javascript
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version
    });
});
```

#### Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

## Phase 2: Advanced Features

### 1. IPFS Integration
- Decentralized file storage
- Content addressing
- Redundancy and availability

### 2. Advanced RBAC
- Granular permissions
- Role hierarchies
- Dynamic access control

### 3. Legal Compliance
- Digital signatures
- Court-ready exports
- Compliance reporting

### 4. Mobile App
- React Native implementation
- Offline capability
- Push notifications

## Security Checklist

- [ ] Smart contract audited
- [ ] API endpoints secured
- [ ] File upload validation
- [ ] Rate limiting implemented
- [ ] HTTPS enforced
- [ ] Database encrypted
- [ ] Secrets management
- [ ] Audit logging enabled
- [ ] Backup strategy implemented
- [ ] Incident response plan

## Go-Live Checklist

- [ ] Smart contract deployed to mainnet
- [ ] Database migrated to production
- [ ] SSL certificates configured
- [ ] Monitoring dashboards set up
- [ ] Backup systems tested
- [ ] User training completed
- [ ] Legal review completed
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Documentation finalized