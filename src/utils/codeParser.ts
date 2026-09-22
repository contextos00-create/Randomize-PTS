import { DynamicVariable, ParameterCategory, VariableType } from '../types';

/**
 * Parses JSDoc style `@param` tags from custom Pts.js code
 * Example:
 * // @param {slider} name="Lissajous A" key="lissA" min=1 max=10 step=1 val=3 cat="function"
 * // @param {color} name="Ribbon Tint" key="ribbonTint" val="#6366f1" cat="look"
 * // @param {toggle} name="Draw Spokes" key="drawSpokes" val=true cat="attributes"
 */
export function extractVariablesFromCode(code: string): DynamicVariable[] {
  const variables: DynamicVariable[] = [];
  const lines = code.split('\n');

  const paramRegex =
    /@param\s+\{(slider|color|select|toggle)\}\s+(?:name="([^"]+)")?\s*(?:key="([^"]+)")?\s*(?:min=([0-9.-]+))?\s*(?:max=([0-9.-]+))?\s*(?:step=([0-9.-]+))?\s*(?:val="?([^"\s]+)"?)?\s*(?:cat="([^"]+)")?/i;

  for (const line of lines) {
    if (!line.includes('@param')) continue;

    const match = line.match(paramRegex);
    if (!match) continue;

    const [
      ,
      rawType,
      name,
      key,
      minStr,
      maxStr,
      stepStr,
      valStr,
      catStr,
    ] = match;

    const rawParsed = rawType?.toLowerCase() || 'slider';
    let varType: VariableType = 'number';
    if (rawParsed === 'color') varType = 'color';
    else if (rawParsed === 'toggle' || rawParsed === 'boolean') varType = 'boolean';
    else if (rawParsed === 'select') varType = 'select';
    else varType = 'number';

    const safeKey = key || name?.toLowerCase().replace(/[^a-z0-9]/g, '') || `var_${Date.now()}`;
    const safeName = name || safeKey;

    let category: ParameterCategory = 'function';
    if (catStr && ['physics', 'function', 'look', 'attributes'].includes(catStr.toLowerCase())) {
      category = catStr.toLowerCase() as ParameterCategory;
    }

    let value: any = 0;
    let min = minStr ? parseFloat(minStr) : 0;
    let max = maxStr ? parseFloat(maxStr) : 100;
    let step = stepStr ? parseFloat(stepStr) : 1;

    if (varType === 'number') {
      value = valStr ? parseFloat(valStr) : (min + max) / 2;
    } else if (varType === 'color') {
      value = valStr || '#18181b';
    } else if (varType === 'boolean') {
      value = valStr === 'true' || valStr === '1';
    } else if (varType === 'select') {
      value = valStr || 'default';
    }

    variables.push({
      id: `custom-${safeKey}`,
      name: safeName,
      key: safeKey,
      category,
      type: varType,
      value,
      defaultValue: value,
      isLocked: false,
      min: varType === 'number' ? min : undefined,
      max: varType === 'number' ? max : undefined,
      step: varType === 'number' ? step : undefined,
    });
  }

  return variables;
}

/**
 * Merges extracted variables with existing variables, capping at maxCount (default 20)
 */
export function mergeCustomVariables(
  current: DynamicVariable[],
  extracted: DynamicVariable[],
  maxCount: number = 20
): DynamicVariable[] {
  const updated = [...current];

  for (const ext of extracted) {
    const existingIndex = updated.findIndex((v) => v.key === ext.key);
    if (existingIndex >= 0) {
      // Keep user's current lock status and custom values if set
      updated[existingIndex] = {
        ...ext,
        value: updated[existingIndex].value,
        isLocked: updated[existingIndex].isLocked,
        id: updated[existingIndex].id,
      };
    } else {
      if (updated.length < maxCount) {
        updated.push(ext);
      }
    }
  }

  return updated.slice(0, maxCount);
}
