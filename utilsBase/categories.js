const categories = [
  {
    _id: "62c827b5a427b63741da9175",
    status: "show",
    name: {
      en: "Home",
      es: "Inicio",
    },
    id: "Root",
    parentName: "Home",
    description: {
      en: "This is Home Category",
      es: "Esta es la categoría Inicio",
    },
  },
  {
    _id: "632ab2864d87ff2494210a8a",
    status: "show",
    name: {
      en: "Apple",
      es: "Manzana",
    },
    description: {
      en: "Apple",
      es: "Manzana",
    },
    parentId: "62c827b5a427b63741da9175",
    parentName: "Home",
    icon: "https://res.cloudinary.com/dmhgigndy/image/upload/v1758557344/category/channels4_profile.jpg",
  },
  {
    _id: "632ab2b64d87ff2494210aa7",
    status: "show",
    name: {
      en: "iPhone",
      es: "iPhone",
    },
    description: {
      en: "Cell Phones",
      es: "Celulares",
    },
    parentId: "632ab2864d87ff2494210a8a",
    parentName: "Apple",
    icon: "",
  },
];

module.exports = categories;
