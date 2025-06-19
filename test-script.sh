#!/bin/bash

# Cursor Rules Local Testing Script
set -e

echo "🧪 Starting Cursor Rules Local Testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Helper functions
test_passed() {
    echo -e "${GREEN}✅ $1${NC}"
}

test_failed() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

test_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

test_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Setup test directory
TEST_DIR="/tmp/cursor-rules-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

test_info "Testing in: $TEST_DIR"

echo
echo "📋 Test 1: Basic CLI availability"
if cursor-rules --version; then
    test_passed "CLI is available globally"
else
    test_failed "CLI not found - did you run 'pnpm link --global'?"
fi

echo
echo "📋 Test 2: Help and list commands"
cursor-rules --help > /dev/null || test_failed "Help command failed"
test_passed "Help command works"

cursor-rules list > /dev/null || test_failed "List command failed"
test_passed "List command works"

echo
echo "📋 Test 3: Git project detection"
mkdir git-project && cd git-project
git init > /dev/null 2>&1
echo "# Test project" > README.md
git add . && git commit -m "initial" > /dev/null 2>&1

cursor-rules status > /dev/null || test_failed "Status in git project failed"
test_passed "Git project detection works"
cd ..

echo
echo "📋 Test 4: NPM project detection"
mkdir npm-project && cd npm-project
npm init -y > /dev/null 2>&1

cursor-rules status > /dev/null || test_failed "Status in npm project failed"
test_passed "NPM project detection works"
cd ..

echo
echo "📋 Test 5: Install rules functionality"
cd git-project

# Test dry run
cursor-rules install typescript --dry-run || test_failed "Dry run install failed"
test_passed "Dry run install works"

# Test actual install
cursor-rules install typescript || test_failed "Install failed"
test_passed "Install command works"

# Check if rules were installed
if [ -d ".cursor/rules" ]; then
    test_passed "Rules directory created"
else
    test_failed "Rules directory not created"
fi

# Check if files exist
if [ -f ".cursor/rules/strict-types.mdc" ]; then
    test_passed "Rule files installed"
else
    test_failed "Rule files not found"
fi

echo
echo "📋 Test 6: Status after install"
cursor-rules status || test_failed "Status after install failed"
test_passed "Status shows installed rules"

echo
echo "📋 Test 7: Install multiple categories"
cursor-rules install react general || test_failed "Multiple category install failed"
test_passed "Multiple category install works"

echo
echo "📋 Test 8: Remove functionality"
cursor-rules remove typescript || test_failed "Remove command failed"
test_passed "Remove command works"

# Check if typescript rules were removed
if [ ! -f ".cursor/rules/strict-types.mdc" ]; then
    test_passed "Rules properly removed"
else
    test_failed "Rules not removed"
fi

echo
echo "📋 Test 9: Custom target path"
mkdir -p ../custom-target
cursor-rules install typescript --to ../custom-target || test_failed "Custom target install failed"
test_passed "Custom target path works"

if [ -d "../custom-target/.cursor/rules" ]; then
    test_passed "Custom target directory created"
else
    test_failed "Custom target directory not created"
fi

echo
echo "📋 Test 10: Error handling"
cd ../empty-dir 2>/dev/null || mkdir ../empty-dir && cd ../empty-dir

# This should fail gracefully
if cursor-rules install typescript 2>/dev/null; then
    test_warning "Install should fail in non-project directory"
else
    test_passed "Proper error handling for non-project directory"
fi

cd "$TEST_DIR"

echo
echo "📋 Test 11: Verbose mode"
cd git-project
cursor-rules install general --verbose || test_failed "Verbose mode failed"
test_passed "Verbose mode works"

echo
echo "🧹 Cleanup"
cd /
rm -rf "$TEST_DIR"
test_passed "Test directory cleaned up"

echo
echo -e "${GREEN}🎉 All tests passed! Your cursor-rules CLI is ready for publishing.${NC}"
echo
echo "Next steps:"
echo "1. Test in a real project: cd /path/to/your/project && cursor-rules install typescript"
echo "2. Verify package structure: cd packages/cli && npm pack"
echo "3. Test the tarball: npm install -g cursor-rules-0.1.0.tgz"
echo "4. When ready: pnpm changeset && git push" 