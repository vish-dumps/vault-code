import { mongoStorage } from './mongodb-storage';
import { connectToMongoDB } from './mongodb';

export async function seedDummyData() {
  console.log('🌱 Seeding dummy data...');

  // Check if any users already exist
  const existingUser = await mongoStorage.getUserByUsername('demo-user');
  if (existingUser) {
    console.log('✅ Demo user already exists, skipping seed data');
    return;
  }

  // Create a default user
  let user;
  try {
    user = await mongoStorage.createUser({
      username: 'demo-user',
      email: 'demo@example.com',
      password: 'CodeVault2024!', // This will be hashed by the User model
      name: 'Demo User',
      leetcodeUsername: 'demo_leetcode',
      codeforcesUsername: 'demo_codeforces',
    });
  } catch (error: any) {
    if (error.code === 11000 || error.message.includes('E11000')) {
      console.log('✅ Demo user already exists (caught E11000), skipping creation');
      const existing = await mongoStorage.getUserByUsername('demo-user');
      if (existing) {
        user = existing;
      } else {
        console.error('❌ Error: Could not find existing user after duplicate key error');
        return;
      }
    } else {
      throw error;
    }
  }

  console.log('✅ Created user:', user.username);

  // Create sample questions with approaches
  const sampleQuestions = [
    {
      title: 'Two Sum',
      platform: 'LeetCode',
      link: 'https://leetcode.com/problems/two-sum/',
      difficulty: 'Easy',
      notes: 'Classic hash map problem. Great for beginners!',
      tags: ['Array', 'Hash Table'],
      approaches: [
        {
          name: 'Hash Map Approach',
          language: 'javascript',
          code: `function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}`,
          notes: 'Time: O(n), Space: O(n)'
        },
        {
          name: 'Brute Force',
          language: 'Python',
          code: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`,
          notes: 'Time: O(n²), Space: O(1)'
        }
      ]
    },
    {
      title: 'Valid Parentheses',
      platform: 'LeetCode',
      link: 'https://leetcode.com/problems/valid-parentheses/',
      difficulty: 'Easy',
      notes: 'Stack-based solution. Watch out for edge cases!',
      tags: ['String', 'Stack'],
      approaches: [
        {
          name: 'Stack Solution',
          language: 'javascript',
          code: `function isValid(s) {
  const stack = [];
  const pairs = {
    '(': ')',
    '[': ']',
    '{': '}'
  };
  
  for (let char of s) {
    if (pairs[char]) {
      stack.push(char);
    } else {
      const last = stack.pop();
      if (pairs[last] !== char) {
        return false;
      }
    }
  }
  
  return stack.length === 0;
}`,
          notes: 'Time: O(n), Space: O(n)'
        }
      ]
    },
    {
      title: 'Binary Tree Inorder Traversal',
      platform: 'LeetCode',
      link: 'https://leetcode.com/problems/binary-tree-inorder-traversal/',
      difficulty: 'Easy',
      notes: 'Fundamental tree traversal. Practice both recursive and iterative approaches.',
      tags: ['Tree', 'Stack', 'Depth-First Search'],
      approaches: [
        {
          name: 'Recursive',
          language: 'Python',
          code: `def inorderTraversal(root):
    result = []
    
    def inorder(node):
        if node:
            inorder(node.left)
            result.append(node.val)
            inorder(node.right)
    
    inorder(root)
    return result`,
          notes: 'Time: O(n), Space: O(h) where h is height'
        },
        {
          name: 'Iterative with Stack',
          language: 'javascript',
          code: `function inorderTraversal(root) {
  const result = [];
  const stack = [];
  let current = root;
  
  while (current || stack.length > 0) {
    while (current) {
      stack.push(current);
      current = current.left;
    }
    
    current = stack.pop();
    result.push(current.val);
    current = current.right;
  }
  
  return result;
}`,
          notes: 'Time: O(n), Space: O(h)'
        }
      ]
    },
    {
      title: 'Maximum Subarray',
      platform: 'LeetCode',
      link: 'https://leetcode.com/problems/maximum-subarray/',
      difficulty: 'Medium',
      notes: 'Kadane\'s algorithm. Classic DP problem!',
      tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
      approaches: [
        {
          name: 'Kadane\'s Algorithm',
          language: 'Python',
          code: `def maxSubArray(nums):
    max_sum = current_sum = nums[0]
    
    for i in range(1, len(nums)):
        current_sum = max(nums[i], current_sum + nums[i])
        max_sum = max(max_sum, current_sum)
    
    return max_sum`,
          notes: 'Time: O(n), Space: O(1)'
        }
      ]
    },
    {
      title: 'Longest Common Subsequence',
      platform: 'LeetCode',
      link: 'https://leetcode.com/problems/longest-common-subsequence/',
      difficulty: 'Medium',
      notes: 'Classic 2D DP problem. Great for understanding dynamic programming.',
      tags: ['Dynamic Programming', 'String'],
      approaches: [
        {
          name: '2D DP',
          language: 'Python',
          code: `def longestCommonSubsequence(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]`,
          notes: 'Time: O(m*n), Space: O(m*n)'
        },
        {
          name: 'Space Optimized',
          language: 'javascript',
          code: `function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i-1] === text2[j-1]) {
        curr[j] = prev[j-1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j-1]);
      }
    }
    [prev, curr] = [curr, prev];
  }
  
  return prev[n];
}`,
          notes: 'Time: O(m*n), Space: O(min(m,n))'
        }
      ]
    }
  ];

  // Create questions
  for (const questionData of sampleQuestions) {
    const question = await mongoStorage.createQuestion(questionData, user.id);
    console.log(`✅ Created question: ${question.title}`);
  }

  // Update topic progress
  await mongoStorage.updateTopicProgress(user.id, 'Array', 2);
  await mongoStorage.updateTopicProgress(user.id, 'Hash Table', 1);
  await mongoStorage.updateTopicProgress(user.id, 'String', 1);
  await mongoStorage.updateTopicProgress(user.id, 'Stack', 2);
  await mongoStorage.updateTopicProgress(user.id, 'Tree', 1);
  await mongoStorage.updateTopicProgress(user.id, 'Dynamic Programming', 2);

  console.log('🎉 Dummy data seeded successfully!');
  console.log(`📊 Created ${sampleQuestions.length} questions with multiple approaches`);
  console.log('👤 User: demo-user');
  console.log('🔗 You can now test the application with this sample data');
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDummyData().catch(console.error);
}
