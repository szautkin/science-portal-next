#!/bin/bash

###############################################################################
# VOSpace API Test Script
#
# This script demonstrates all VOSpace API endpoints with practical examples.
# Replace YOUR_TOKEN and YOUR_USERNAME with actual values.
###############################################################################

set -e  # Exit on error

# Configuration
API_BASE="http://localhost:3000/api/vospace"
TOKEN="${VOSPACE_TOKEN:-YOUR_TOKEN}"
USERNAME="${VOSPACE_USERNAME:-YOUR_USERNAME}"
BASE_PATH="home/${USERNAME}/test-$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "\n${YELLOW}==== TEST: $1 ====${NC}"
}

check_config() {
    if [ "$TOKEN" = "YOUR_TOKEN" ]; then
        log_error "Please set VOSPACE_TOKEN environment variable"
        echo "Example: export VOSPACE_TOKEN=your-actual-token"
        exit 1
    fi

    if [ "$USERNAME" = "YOUR_USERNAME" ]; then
        log_error "Please set VOSPACE_USERNAME environment variable"
        echo "Example: export VOSPACE_USERNAME=your-username"
        exit 1
    fi
}

###############################################################################
# Test 1: Create a folder
###############################################################################
test_create_folder() {
    log_test "Create Folder"

    local response=$(curl -s -X PUT \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"type":"folder","title":"Test Folder"}' \
        "${API_BASE}/nodes/${BASE_PATH}")

    echo "$response" | jq '.'

    if echo "$response" | jq -e '.success' > /dev/null; then
        log_success "Folder created: ${BASE_PATH}"
    else
        log_error "Failed to create folder"
        exit 1
    fi
}

###############################################################################
# Test 2: Upload a Python script (JSON with UTF-8)
###############################################################################
test_upload_python_script() {
    log_test "Upload Python Script (JSON UTF-8)"

    local script_content='#!/usr/bin/env python
"""Hello World from VOSpace"""

def main():
    print("Hello from VOSpace!")
    print("This file was uploaded through the Science Portal")
    print("Upload time: 2025-11-02")

if __name__ == "__main__":
    main()
'

    local response=$(curl -s -X POST \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"path\": \"${BASE_PATH}/hello.py\",
            \"content\": $(echo "$script_content" | jq -Rs .),
            \"encoding\": \"utf8\",
            \"title\": \"Hello World Script\"
        }" \
        "${API_BASE}/transfer")

    echo "$response" | jq '.'

    if echo "$response" | jq -e '.success' > /dev/null; then
        log_success "Python script uploaded: ${BASE_PATH}/hello.py"
    else
        log_error "Failed to upload Python script"
        exit 1
    fi
}

###############################################################################
# Test 3: Upload a text file (multipart form data)
###############################################################################
test_upload_text_file() {
    log_test "Upload Text File (Multipart)"

    # Create a temporary text file
    local temp_file=$(mktemp)
    cat > "$temp_file" << 'EOF'
This is a test text file.
It contains multiple lines.
Created for testing VOSpace upload functionality.

Line 5
Line 6
EOF

    local response=$(curl -s -X POST \
        -H "Authorization: Bearer ${TOKEN}" \
        -F "path=${BASE_PATH}/test.txt" \
        -F "file=@${temp_file}" \
        -F "title=Test Text File" \
        "${API_BASE}/transfer")

    rm "$temp_file"

    echo "$response" | jq '.'

    if echo "$response" | jq -e '.success' > /dev/null; then
        log_success "Text file uploaded: ${BASE_PATH}/test.txt"
    else
        log_error "Failed to upload text file"
        exit 1
    fi
}

###############################################################################
# Test 4: List directory contents
###############################################################################
test_list_directory() {
    log_test "List Directory Contents"

    local response=$(curl -s -X GET \
        -H "Authorization: Bearer ${TOKEN}" \
        "${API_BASE}/nodes/${BASE_PATH}")

    echo "$response" | jq '.'

    local count=$(echo "$response" | jq 'length')
    log_success "Found ${count} items in directory"
}

###############################################################################
# Test 5: Get node metadata
###############################################################################
test_get_metadata() {
    log_test "Get Node Metadata"

    local response=$(curl -s -X GET \
        -H "Authorization: Bearer ${TOKEN}" \
        "${API_BASE}/nodes/${BASE_PATH}/hello.py?detail=metadata")

    echo "$response" | jq '.'

    if echo "$response" | jq -e '.uri' > /dev/null; then
        log_success "Retrieved metadata for hello.py"
    else
        log_error "Failed to get metadata"
        exit 1
    fi
}

###############################################################################
# Test 6: Update node properties
###############################################################################
test_update_properties() {
    log_test "Update Node Properties"

    local response=$(curl -s -X POST \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "properties": {
                "title": "Updated Hello World Script",
                "description": "This property was updated via API"
            }
        }' \
        "${API_BASE}/nodes/${BASE_PATH}/hello.py")

    echo "$response" | jq '.'

    if echo "$response" | jq -e '.success' > /dev/null; then
        log_success "Properties updated"
    else
        log_error "Failed to update properties"
        exit 1
    fi
}

###############################################################################
# Test 7: Download file
###############################################################################
test_download_file() {
    log_test "Download File"

    local output_file="/tmp/downloaded-hello.py"

    curl -s -H "Authorization: Bearer ${TOKEN}" \
        -o "$output_file" \
        "${API_BASE}/transfer?path=${BASE_PATH}/hello.py"

    if [ -f "$output_file" ]; then
        log_success "File downloaded to: $output_file"
        log_info "File contents:"
        echo "----------------------------------------"
        head -n 10 "$output_file"
        echo "----------------------------------------"
        rm "$output_file"
    else
        log_error "Failed to download file"
        exit 1
    fi
}

###############################################################################
# Test 8: Create nested folder structure
###############################################################################
test_nested_folders() {
    log_test "Create Nested Folders"

    # Create data folder
    curl -s -X PUT \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"type":"folder","title":"Data Folder"}' \
        "${API_BASE}/nodes/${BASE_PATH}/data" | jq '.'

    # Create scripts folder
    curl -s -X PUT \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"type":"folder","title":"Scripts Folder"}' \
        "${API_BASE}/nodes/${BASE_PATH}/scripts" | jq '.'

    log_success "Created nested folder structure"
}

###############################################################################
# Test 9: Upload JSON data file
###############################################################################
test_upload_json() {
    log_test "Upload JSON Data File"

    local json_content='{
    "experiment": "test-001",
    "timestamp": "2025-11-02T10:30:00Z",
    "data": {
        "temperature": 23.5,
        "humidity": 65.2,
        "pressure": 1013.25
    },
    "observations": [
        {"id": 1, "value": 42.1},
        {"id": 2, "value": 43.7},
        {"id": 3, "value": 41.9}
    ]
}'

    local response=$(curl -s -X POST \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"path\": \"${BASE_PATH}/data/experiment.json\",
            \"content\": $(echo "$json_content" | jq -Rs .),
            \"encoding\": \"utf8\"
        }" \
        "${API_BASE}/transfer")

    echo "$response" | jq '.'

    if echo "$response" | jq -e '.success' > /dev/null; then
        log_success "JSON file uploaded"
    else
        log_error "Failed to upload JSON"
        exit 1
    fi
}

###############################################################################
# Test 10: Delete individual file
###############################################################################
test_delete_file() {
    log_test "Delete Individual File"

    local response=$(curl -s -X DELETE \
        -H "Authorization: Bearer ${TOKEN}" \
        "${API_BASE}/nodes/${BASE_PATH}/test.txt")

    echo "$response" | jq '.'

    if echo "$response" | jq -e '.success' > /dev/null; then
        log_success "File deleted: test.txt"
    else
        log_error "Failed to delete file"
        exit 1
    fi
}

###############################################################################
# Test 11: List root directory
###############################################################################
test_list_root() {
    log_test "List Root Directory"

    local response=$(curl -s -X GET \
        -H "Authorization: Bearer ${TOKEN}" \
        "${API_BASE}/nodes/home/${USERNAME}")

    local count=$(echo "$response" | jq 'length')
    log_info "Found ${count} items in home directory"
    echo "$response" | jq '.[] | {name: .name, type: .type}'
}

###############################################################################
# Cleanup: Delete test folder
###############################################################################
cleanup() {
    log_test "Cleanup - Delete Test Folder"

    local response=$(curl -s -X DELETE \
        -H "Authorization: Bearer ${TOKEN}" \
        "${API_BASE}/nodes/${BASE_PATH}")

    echo "$response" | jq '.'

    if echo "$response" | jq -e '.success' > /dev/null; then
        log_success "Test folder deleted: ${BASE_PATH}"
    else
        log_error "Failed to delete test folder"
    fi
}

###############################################################################
# Main execution
###############################################################################
main() {
    log_info "VOSpace API Test Suite"
    log_info "====================="
    log_info "API Base: ${API_BASE}"
    log_info "Username: ${USERNAME}"
    log_info "Test Path: ${BASE_PATH}"
    echo ""

    check_config

    # Run tests
    test_create_folder
    test_upload_python_script
    test_upload_text_file
    test_list_directory
    test_get_metadata
    test_update_properties
    test_download_file
    test_nested_folders
    test_upload_json
    test_delete_file
    test_list_root

    # Cleanup
    if [ "${SKIP_CLEANUP:-0}" != "1" ]; then
        cleanup
    else
        log_info "Skipping cleanup (SKIP_CLEANUP=1)"
    fi

    echo ""
    log_success "All tests completed successfully!"
}

# Run main
main "$@"
