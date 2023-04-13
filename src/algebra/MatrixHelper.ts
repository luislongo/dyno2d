import * as MATH from 'mathjs';

export type ApplyCallback<T> = (value: MATH.Matrix, index: number[], matrix: MATH.Matrix) => T; 

const applyOnSubset = <T>(A: MATH.Matrix, index: MATH.Index, callback: ApplyCallback<T>) => {
    return A.subset(index, A.subset(index).map(callback));
}

const addMatrixToSubset = (A: MATH.Matrix, index: MATH.Index, B: MATH.Matrix) => {
    return applyOnSubset(A, index, (value, index) => {
        return value + B.get(index);
    });
}




const MatrixHelper = {
    applyOnSubset,
    addMatrixToSubset
}

export default MatrixHelper;