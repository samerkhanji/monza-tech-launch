// Bundle analysis utilities for Monza Tech

interface BundleInfo {
  name: string;
  size: number;
  gzipSize: number;
  percentage: number;
}

// Analyze bundle sizes from build output
export const analyzeBundleSizes = (buildOutput: string): BundleInfo[] => {
  const lines = buildOutput.split('\n');
  const bundles: BundleInfo[] = [];
  let totalSize = 0;
  
  lines.forEach(line => {
    // Match lines like: "dist/assets/index-CG8oOGKh.js 808.09 kB │ gzip: 259.44 kB"
    const match = line.match(/dist\/assets\/([^.]+)\.js\s+([\d.]+)\s+kB\s+│\s+gzip:\s+([\d.]+)\s+kB/);
    if (match) {
      const [, name, size, gzipSize] = match;
      const sizeNum = parseFloat(size);
      const gzipSizeNum = parseFloat(gzipSize);
      
      bundles.push({
        name,
        size: sizeNum,
        gzipSize: gzipSizeNum,
        percentage: 0 // Will be calculated later
      });
      
      totalSize += sizeNum;
    }
  });
  
  // Calculate percentages
  bundles.forEach(bundle => {
    bundle.percentage = (bundle.size / totalSize) * 100;
  });
  
  // Sort by size (largest first)
  return bundles.sort((a, b) => b.size - a.size);
};

// Identify large dependencies
export const identifyLargeDependencies = (bundles: BundleInfo[]) => {
  const largeBundles = bundles.filter(bundle => bundle.size > 100);
  const vendorBundles = bundles.filter(bundle => 
    bundle.name.includes('vendor') || 
    bundle.name.includes('node_modules')
  );
  
  return {
    largeBundles,
    vendorBundles,
    recommendations: generateOptimizationRecommendations(bundles)
  };
};

// Generate optimization recommendations
export const generateOptimizationRecommendations = (bundles: BundleInfo[]) => {
  const recommendations: string[] = [];
  
  bundles.forEach(bundle => {
    if (bundle.size > 200) {
      recommendations.push(`🔴 ${bundle.name}: ${bundle.size} kB - Consider code splitting`);
    } else if (bundle.size > 100) {
      recommendations.push(`🟡 ${bundle.name}: ${bundle.size} kB - Monitor size`);
    }
  });
  
  return recommendations;
};

// Check for duplicate dependencies
export const checkDuplicateDependencies = () => {
  const modules = (window as any).__webpack_modules__ || {};
  const duplicates: Record<string, string[]> = {};
  
  Object.keys(modules).forEach(moduleId => {
    const module = modules[moduleId];
    if (module && module.exports) {
      const moduleName = module.exports.name || moduleId;
      if (!duplicates[moduleName]) {
        duplicates[moduleName] = [];
      }
      duplicates[moduleName].push(moduleId);
    }
  });
  
  return Object.entries(duplicates)
    .filter(([, instances]) => instances.length > 1)
    .map(([name, instances]) => ({
      name,
      instances,
      count: instances.length
    }));
};

// Analyze import patterns
export const analyzeImportPatterns = (code: string) => {
  const imports = code.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
  const importMap: Record<string, number> = {};
  
  imports.forEach(importStatement => {
    const match = importStatement.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      const module = match[1];
      importMap[module] = (importMap[module] || 0) + 1;
    }
  });
  
  return Object.entries(importMap)
    .sort(([, a], [, b]) => b - a)
    .map(([module, count]) => ({ module, count }));
};

// Tree shaking analysis
export const analyzeTreeShaking = (bundles: BundleInfo[]) => {
  const unusedCode = bundles
    .filter(bundle => bundle.name.includes('vendor'))
    .map(bundle => ({
      name: bundle.name,
      potentialSavings: Math.round(bundle.size * 0.3), // Estimate 30% unused code
      recommendation: 'Consider tree shaking or dynamic imports'
    }));
  
  return unusedCode;
};

// Generate bundle report
export const generateBundleReport = (buildOutput: string) => {
  const bundles = analyzeBundleSizes(buildOutput);
  const analysis = identifyLargeDependencies(bundles);
  const treeShaking = analyzeTreeShaking(bundles);
  
  return {
    summary: {
      totalBundles: bundles.length,
      totalSize: bundles.reduce((sum, b) => sum + b.size, 0),
      totalGzipSize: bundles.reduce((sum, b) => sum + b.gzipSize, 0),
      largestBundle: bundles[0],
      averageSize: bundles.reduce((sum, b) => sum + b.size, 0) / bundles.length
    },
    largeBundles: analysis.largeBundles,
    vendorBundles: analysis.vendorBundles,
    recommendations: analysis.recommendations,
    treeShakingOpportunities: treeShaking,
    topBundles: bundles.slice(0, 10)
  };
}; 