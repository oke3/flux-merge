#!/bin/bash
# Flux Merge: Bulletproof Validation Pipeline

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🚀 Starting Bulletproof Validation Pipeline..."
echo "--------------------------------------------------"

# 1. Type Check & Build
echo -e "${GREEN}Step 1: Type Checking & Bundling...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed. Fix type errors before proceeding.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Build Successful${NC}"

# 2. Asset Audit
echo -e "
${GREEN}Step 2: Asset Integrity Audit...${NC}"
node scripts/audit-assets.cjs
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Asset Audit failed. Check for missing files.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Assets Verified${NC}"

# 3. Unit & Integration Tests
echo -e "
${GREEN}Step 3: Running Logic Tests (Truth Tables & Adversarial)...${NC}"
npm test run
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Logic Tests failed. Regressions detected.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Logic Verified${NC}"

# 4. Smoke Tests (Headless Browser)
echo -e "
${GREEN}Step 4: Headless Smoke Testing...${NC}"
# We run the dev server in the background, run tests, then kill the server
npm run dev & 
DEV_PID=$!
sleep 5
npx playwright test tests/smoke.spec.ts
TEST_RESULT=$?

# Kill the dev server
kill $DEV_PID

if [ $TEST_RESULT -ne 0 ]; then
  echo -e "${RED}❌ Smoke Tests failed. Game does not boot correctly.${NC,}"
  exit 1
fi
echo -e "${GREEN}✅ Smoke Tests Passed${NC}"

echo "--------------------------------------------------"
echo -e "${GREEN}🏆 ALL SYSTEMS GO: Build is Bulletproof!${NC}"
echo "--------------------------------------------------"
