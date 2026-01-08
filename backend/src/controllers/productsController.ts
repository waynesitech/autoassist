import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all products
export const getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY id';

    const [rows] = await pool.query(query, params) as any;
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]) as any;

    if (rows.length === 0) {
      const error: AppError = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new product
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('=== CREATE PRODUCT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    const { name, price, category, image, stock } = req.body;
    // Get workshop_id directly from req.body to avoid destructuring issues
    const workshop_id = req.body.workshop_id;
    console.log('Extracted workshop_id from req.body:', workshop_id, 'Type:', typeof workshop_id);

    if (!name || price === undefined || !category || !image || stock === undefined) {
      const error: AppError = new Error('Missing required fields: name, price, category, image, stock');
      error.statusCode = 400;
      throw error;
    }

    // Validate and normalize workshop_id (integer foreign key to workshops table)
    console.log('=== CREATING PRODUCT WITH WORKSHOP_ID ===');
    console.log('Received workshop_id:', workshop_id, 'Type:', typeof workshop_id);
    let normalizedWorkshopId: number | null = null;
    
    if (workshop_id !== undefined && workshop_id !== null && workshop_id !== '') {
      // Parse the workshop_id - handle both string and number
      let parsedId: number;
      if (typeof workshop_id === 'string') {
        parsedId = parseInt(workshop_id, 10);
      } else if (typeof workshop_id === 'number') {
        parsedId = workshop_id;
      } else {
        parsedId = NaN;
      }
      
      console.log('Parsed workshop_id:', parsedId, 'isNaN:', isNaN(parsedId), 'isInteger:', Number.isInteger(parsedId));
      
      // Validate it's a positive integer (valid foreign key)
      if (!isNaN(parsedId) && parsedId > 0 && Number.isInteger(parsedId)) {
        // Verify workshop exists if workshop_id is provided
        console.log('Checking if workshop exists with ID:', parsedId);
        const [workshopCheck] = await pool.query('SELECT id FROM workshops WHERE id = ?', [parsedId]) as any;
        console.log('Workshop check result:', workshopCheck, 'Length:', workshopCheck.length);
        
        if (workshopCheck.length === 0) {
          const error: AppError = new Error(`Workshop with ID ${parsedId} does not exist`);
          error.statusCode = 400;
          throw error;
        }
        normalizedWorkshopId = parsedId;
        console.log('✓ Workshop validated, setting workshop_id to:', normalizedWorkshopId);
      } else {
        console.log('✗ Invalid workshop_id value:', parsedId, '- setting to null');
        normalizedWorkshopId = null;
      }
    } else {
      console.log('workshop_id not provided or is null/empty - setting to null');
    }

    console.log('Final normalizedWorkshopId:', normalizedWorkshopId);
    const [result] = await pool.query(
      'INSERT INTO products (name, price, category, image, stock, workshop_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, category, image, stock, normalizedWorkshopId]
    ) as any;

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]) as any;
    console.log('Created product:', JSON.stringify(products[0], null, 2));
    console.log('Created product workshop_id:', products[0]?.workshop_id);
    
    // Verify with direct query
    const [verify] = await pool.query('SELECT id, workshop_id FROM products WHERE id = ?', [result.insertId]) as any;
    console.log('Verification query - workshop_id:', verify[0]?.workshop_id);

    const responseData: any = { ...products[0] };
    responseData._debug = {
      receivedWorkshopId: workshop_id,
      normalizedWorkshopId: normalizedWorkshopId,
      databaseWorkshopId: products[0]?.workshop_id,
      verificationWorkshopId: verify[0]?.workshop_id
    };

    res.status(201).json(responseData);
  } catch (error) {
    next(error);
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);
    console.log('Update product request - Product ID:', productId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    const { name, price, category, image, stock } = req.body;
    // Get workshop_id directly from req.body to avoid destructuring issues
    const workshop_id = req.body.workshop_id;
    console.log('Extracted workshop_id from req.body:', workshop_id, 'Type:', typeof workshop_id);
    console.log('req.body.workshop_id direct access:', req.body.workshop_id);

    // Check if product exists
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]) as any;
    if (existing.length === 0) {
      const error: AppError = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // Build update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(price);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(image);
    }
    if (stock !== undefined) {
      updateFields.push('stock = ?');
      updateValues.push(stock);
    }
    // ALWAYS process workshop_id - check both req.body.workshop_id and the variable
    console.log('=== WORKSHOP_ID PROCESSING ===');
    console.log('req.body keys:', Object.keys(req.body));
    console.log('req.body.workshop_id:', req.body.workshop_id, 'type:', typeof req.body.workshop_id);
    console.log('workshop_id variable:', workshop_id, 'type:', typeof workshop_id);
    console.log('"workshop_id" in req.body:', 'workshop_id' in req.body);
    console.log('req.body.workshop_id !== undefined:', req.body.workshop_id !== undefined);
    
    // Process workshop_id - use the value from req.body directly
    let normalizedWorkshopId: number | null = null;
    const workshopIdValue = req.body.workshop_id;
    
    // Check if workshop_id exists in the request (using multiple checks to be safe)
    const hasWorkshopId = 'workshop_id' in req.body || req.body.workshop_id !== undefined || workshop_id !== undefined;
    
    if (hasWorkshopId) {
      console.log('Processing workshop_id value:', workshopIdValue);
      
      // Handle explicit null or empty string to clear workshop_id
      if (workshopIdValue === null || workshopIdValue === '' || workshopIdValue === undefined) {
        normalizedWorkshopId = null;
        console.log('Setting workshop_id to null (explicit clear)');
      } else {
        // Parse the workshop_id - handle both string and number
        let parsedId: number;
        if (typeof workshopIdValue === 'string') {
          parsedId = parseInt(workshopIdValue, 10);
        } else if (typeof workshopIdValue === 'number') {
          parsedId = workshopIdValue;
        } else {
          parsedId = NaN;
        }
        
        console.log('Parsed workshop_id:', parsedId, 'isNaN:', isNaN(parsedId), 'isInteger:', Number.isInteger(parsedId));
        
        if (!isNaN(parsedId) && parsedId > 0 && Number.isInteger(parsedId)) {
          // Verify workshop exists
          console.log('Checking if workshop exists with ID:', parsedId);
          const [workshopCheck] = await pool.query('SELECT id FROM workshops WHERE id = ?', [parsedId]) as any;
          console.log('Workshop check result:', workshopCheck, 'Length:', workshopCheck.length);
          
          if (workshopCheck.length === 0) {
            const error: AppError = new Error(`Workshop with ID ${parsedId} does not exist`);
            error.statusCode = 400;
            throw error;
          }
          normalizedWorkshopId = parsedId;
          console.log('✓ Workshop validated, setting workshop_id to:', normalizedWorkshopId);
        } else {
          console.log('✗ Invalid workshop_id value:', parsedId, '- setting to null');
          normalizedWorkshopId = null;
        }
      }
      
      // ALWAYS add workshop_id to the update when it's in the request
      console.log('Final normalizedWorkshopId:', normalizedWorkshopId);
      updateFields.push('workshop_id = ?');
      updateValues.push(normalizedWorkshopId);
      console.log('✓ Added workshop_id to update. Fields:', updateFields.length, 'Values:', updateValues.length);
      console.log('Update fields:', updateFields);
      console.log('Update values:', updateValues);
    } else {
      console.log('⚠ workshop_id NOT found in request - skipping');
    }

    // CRITICAL: Ensure workshop_id is always included if provided in request
    // Double-check that workshop_id is in the update if it was in the request
    if ('workshop_id' in req.body && !updateFields.some(f => f.includes('workshop_id'))) {
      console.log('⚠ WARNING: workshop_id was in request but not added to update! Adding it now...');
      const workshopIdValue = req.body.workshop_id;
      let normalizedWorkshopId: number | null = null;
      
      if (workshopIdValue !== null && workshopIdValue !== '' && workshopIdValue !== undefined) {
        const parsedId = typeof workshopIdValue === 'string' ? parseInt(workshopIdValue, 10) : Number(workshopIdValue);
        if (!isNaN(parsedId) && parsedId > 0 && Number.isInteger(parsedId)) {
          normalizedWorkshopId = parsedId;
        }
      }
      updateFields.push('workshop_id = ?');
      updateValues.push(normalizedWorkshopId);
      console.log('✓ Added workshop_id as fallback. Value:', normalizedWorkshopId);
    }

    if (updateFields.length === 0) {
      const error: AppError = new Error('No fields to update');
      error.statusCode = 400;
      throw error;
    }

    updateValues.push(productId);

    const updateQuery = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
    
    // Verify the query construction
    console.log('=== UPDATE QUERY DEBUG ===');
    console.log('Update fields count:', updateFields.length);
    console.log('Update values count:', updateValues.length);
    console.log('Fields:', updateFields);
    console.log('Values:', updateValues);
    console.log('Final query:', updateQuery);
    
    // Verify workshop_id is in the query if it was provided
    const workshopIdIndex = updateFields.findIndex(f => f.includes('workshop_id'));
    if (workshopIdIndex >= 0) {
      console.log('workshop_id field index:', workshopIdIndex);
      console.log('workshop_id value at index', workshopIdIndex, ':', updateValues[workshopIdIndex]);
    } else {
      console.log('workshop_id not in update fields (not provided in request)');
    }
    console.log('=== END DEBUG ===');
    
    try {
      console.log('=== EXECUTING UPDATE ===');
      console.log('Query:', updateQuery);
      console.log('Values array:', JSON.stringify(updateValues));
      console.log('Values count:', updateValues.length);
      console.log('Fields count:', updateFields.length);
      
      // Log the exact SQL with values for debugging
      let debugQuery = updateQuery;
      updateValues.forEach((val, idx) => {
        const valueStr = val === null ? 'NULL' : (typeof val === 'string' ? `'${val}'` : val);
        debugQuery = debugQuery.replace('?', valueStr);
      });
      console.log('Debug SQL (with values):', debugQuery);
      
      const [updateResult] = await pool.query(updateQuery, updateValues) as any;
      console.log('Update result:', JSON.stringify(updateResult, null, 2));
      console.log('Rows affected:', (updateResult as any)?.affectedRows);
      console.log('Changed rows:', (updateResult as any)?.changedRows);
      console.log('Update successful:', (updateResult as any)?.affectedRows > 0);
      
      // Immediately verify the update worked
      const [immediateCheck] = await pool.query('SELECT workshop_id FROM products WHERE id = ?', [productId]) as any;
      console.log('Immediate check after update - workshop_id:', immediateCheck[0]?.workshop_id);
      console.log('Immediate check type:', typeof immediateCheck[0]?.workshop_id);
    } catch (sqlError: any) {
      console.error('=== SQL ERROR ===');
      console.error('SQL Error during update:', sqlError);
      console.error('SQL Error code:', sqlError.code);
      console.error('SQL Error message:', sqlError.message);
      console.error('SQL Error sql:', sqlError.sql);
      console.error('SQL Error stack:', sqlError.stack);
      throw sqlError;
    }

    // Verify the update by querying the database
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]) as any;
    console.log('Updated product from database:', JSON.stringify(products[0], null, 2));
    console.log('Product workshop_id value:', products[0]?.workshop_id);
    console.log('Product workshop_id type:', typeof products[0]?.workshop_id);
    
    // Double-check with a direct query
    const [verify] = await pool.query('SELECT id, workshop_id FROM products WHERE id = ?', [productId]) as any;
    console.log('Verification query result:', verify[0]);

    // Add debug info to help diagnose the issue - ALWAYS include it
    const workshopIdFieldIndex = updateFields.findIndex(f => f.includes('workshop_id'));
    const responseData: any = { ...products[0] };
    
    // Build debug object with all relevant information
    const debugInfo: any = {
      receivedWorkshopId: req.body.workshop_id,
      workshopIdInRequest: req.body.workshop_id !== undefined,
      workshopIdFieldIndex: workshopIdFieldIndex,
      updateFieldsCount: updateFields.length,
      updateValuesCount: updateValues.length,
      updateQuery: updateQuery,
      databaseWorkshopId: products[0]?.workshop_id,
      verificationWorkshopId: verify[0]?.workshop_id
    };
    
    if (workshopIdFieldIndex >= 0) {
      debugInfo.normalizedWorkshopId = updateValues[workshopIdFieldIndex];
      debugInfo.updateFields = updateFields;
      debugInfo.updateValues = updateValues;
    } else {
      debugInfo.normalizedWorkshopId = 'not processed - field not in update';
      debugInfo.reason = 'workshop_id field was not added to updateFields array';
    }
    
    responseData._debug = debugInfo;
    
    console.log('=== SENDING RESPONSE ===');
    console.log('Response data workshop_id:', responseData.workshop_id);
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseInt(req.params.id);

    // Check if product exists
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]) as any;
    if (existing.length === 0) {
      const error: AppError = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    await pool.query('DELETE FROM products WHERE id = ?', [productId]);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Configure multer storage
const getImagesPath = (): string => {
  const projectRoot = process.cwd();
  const possiblePaths = [
    path.join(projectRoot, 'mobile/assets/img'),
    path.join(projectRoot, '../mobile/assets/img'),
  ];

  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }

  // Create directory if it doesn't exist
  const defaultPath = path.join(projectRoot, 'mobile/assets/img');
  fs.mkdirSync(defaultPath, { recursive: true });
  return defaultPath;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const imagesPath = getImagesPath();
    cb(null, imagesPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Upload image
export const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      const error: AppError = new Error('No file uploaded');
      error.statusCode = 400;
      throw error;
    }

    const API_BASE_URL = process.env.API_BASE_URL || 'http://autoassist.com.my';
    const imageUrl = `${API_BASE_URL}/static/mobile/assets/img/${req.file.filename}`;

    res.json({
      success: true,
      filename: req.file.filename,
      url: imageUrl,
      path: `/mobile/assets/img/${req.file.filename}`
    });
  } catch (error) {
    next(error);
  }
};

