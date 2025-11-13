# Monitoring & Operations Guide

## Health Checks

### System Health Endpoint

\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`

Response indicates:
- Database connectivity
- Environment configuration
- API availability

### Expected Response

\`\`\`json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "database": "connected",
  "environment": {
    "hasSupabaseUrl": true,
    "hasAppUrl": true,
    "hasAfricasTalking": true
  }
}
\`\`\`

## Key Metrics to Monitor

### Customer Metrics
- Total feedback submissions
- Average product rating
- Conversion rate (QR scans → feedback)
- Reward distribution success rate

### System Metrics
- API response times
- Database query performance
- Error rates
- Data bundle delivery success

### Business Metrics
- Active QR codes
- Revenue from rewards
- Customer engagement
- Campaign performance

## Logging

### Server Logs

All errors logged with \`[v0]\` prefix:

\`\`\`
[v0] Error context: actual error message
[v0] Variable name: value
[v0] API call failed: details
\`\`\`

### Database Logs

Monitor in Supabase:
- Query performance
- Connection issues
- RLS policy violations

### Application Logs

Check in browser console:
- Client-side errors
- API calls
- State changes

## Alerts to Configure

### Critical Alerts

1. **Database Connection Failed**
   - Action: Check Supabase status
   - Action: Verify credentials

2. **High Error Rate**
   - Action: Check server logs
   - Action: Review recent changes

3. **Africa's Talking API Down**
   - Action: Switch to mock mode
   - Action: Queue rewards for processing

### Warning Alerts

1. **Slow Database Queries**
   - Action: Review query performance
   - Action: Add indexes if needed

2. **High Memory Usage**
   - Action: Check for memory leaks
   - Action: Restart server if needed

3. **Pending Rewards Backlog**
   - Action: Run batch processing
   - Action: Verify customer delivery

## Maintenance Tasks

### Daily
- Check error logs
- Monitor reward processing
- Verify API health

### Weekly
- Review performance metrics
- Check database size
- Update security patches

### Monthly
- Full security audit
- Database optimization
- Backup verification
- Dependency updates

## Incident Response

### Procedure

1. **Detect**
   - Identify issue type
   - Check system status

2. **Assess**
   - Severity level
   - Impact scope
   - Root cause

3. **Respond**
   - Implement fix
   - Test solution
   - Deploy fix

4. **Monitor**
   - Watch metrics
   - Verify stability
   - Document incident

5. **Post-Mortem**
   - Review cause
   - Implement prevention
   - Update procedures

## Backup & Recovery

### Backup Strategy

- **Frequency**: Daily automated backups
- **Retention**: 30 days
- **Storage**: Supabase built-in + external backup
- **Verification**: Weekly restore tests

### Recovery Procedure

1. Identify backup point
2. Restore from Supabase
3. Verify data integrity
4. Notify users if needed
5. Document recovery

## Performance Tuning

### Database Optimization

1. **Monitor Query Performance**
   - Check slow queries
   - Add indexes if needed
   - Review query plans

2. **Optimize Queries**
   - Select specific columns
   - Add appropriate filters
   - Use pagination

3. **Archive Old Data**
   - Move old feedback to archive
   - Clean up processed rewards
   - Maintain optimal table size

### API Optimization

1. **Response Caching**
   - Cache analytics data
   - Cache product data
   - Cache campaign data

2. **Rate Limiting**
   - Limit API calls per IP
   - Limit concurrent connections
   - Protect admin endpoints

3. **Load Balancing**
   - Distribute traffic
   - Scale horizontally if needed
   - Monitor resource usage

## Troubleshooting Guide

### Issue: Slow Dashboard Load

**Investigation**
- Check analytics query time
- Monitor database connections
- Review recent changes

**Solution**
- Add caching
- Optimize queries
- Check database indexes

### Issue: Rewards Not Processing

**Investigation**
- Check reward status
- Verify phone numbers
- Review Africa's Talking logs

**Solution**
- Run batch processing manually
- Check API credentials
- Verify phone format

### Issue: High Error Rate

**Investigation**
- Check error logs
- Monitor database
- Review recent deployments

**Solution**
- Identify failing endpoint
- Check logs for root cause
- Deploy fix or rollback

## Reporting

### Daily Report
- System uptime
- Error count
- Reward processing status

### Weekly Report
- Total feedback collected
- Average rating
- Conversion rate
- System performance

### Monthly Report
- Campaign performance
- Revenue impact
- User engagement
- System health

\`\`\`
