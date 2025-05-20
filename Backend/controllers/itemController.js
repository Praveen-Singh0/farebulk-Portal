const Item = require('../models/Item');

// Controller function to save an item
const saveItem = async (req, res) => {
  const { name, id } = req.body;

  console.log("NAMEEEEE", name, id);

  if (!name || !id) {
    return res.status(400).json({ message: 'Name and ID are required' });
  }

  try {
    const newItem = new Item({ name, id });
    await newItem.save();
    res.status(201).json({ message: 'Item saved successfully', item: newItem });
  } catch (error) {
    res.status(500).json({ message: 'Error saving item', error });
  }
};

module.exports = { saveItem };
