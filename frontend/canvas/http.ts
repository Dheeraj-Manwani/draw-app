import axios from "axios";

export async function getExistingShapes(roomId: string) {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_HTTP_BACKEND}/api/v1/room/elements/${roomId}`
    );
    const elements = res.data.elements;

    console.log("res data ", res.data);

    const shapes = elements
      .filter((x: { path: string }) => {
        try {
          JSON.parse(x.path);
          return true;
        } catch (e) {
          console.log(e);
          return false;
        }
      })
      .map((x: { path: string }) => {
        return { ...x, path: JSON.parse(x.path) };
      });

    return shapes;
  } catch (e) {
    console.log("Error occured while fetching data ", e);
    return [];
  }
}
